var o = require('./base');
o.my = function (req, res, next) {

    var _S = this;
    var page = req.query.p;
    var perPage = (req.query.pr) ? req.query.pr : 10;
    var pageList = '';
    //搜索
    var where = {};
    var s = req.query.s;
    var s = eval("\/" + s + "\/i");
    if ('undefined' != typeof req.query.s) {
        where.$or = [
            {title: s},
            {content: s}
        ];
    }
    where.email = user.email;
    var op = {};
    op.where = where;
    op.page = page;
    op.perPage = perPage;


    D('Blog')._list(op, function (err, todos) {

        if (err) return next(err);

        todos.data.forEach(function (vo) {
            vo.creattime = _S.date.dgm(vo.creattime, 'yyyy-mm-dd hh:ii:ss');
            vo.updatetime = _S.date.dgm(vo.updatetime, 'yyyy-mm-dd hh:ii:ss');
            vo.avatar = _S.encode.md5(vo.email);
            vo.content = _S.html.delHtmlTag(vo.content);
            vo.content = vo.content.substring(0, 250);
        })

        pageList = _S.pN.pageNavi(page, todos.count, perPage);
        res.render('blog/index.html', {todos: todos.data, page: pageList});
    });
}


/*	o.add = function (req, res, next) {

 if(!user.status)return res.render('error.html', {message: '社区只为验证邮件用户开放发布话题服务'});
 res.render('blog/add.html');
 }


 o.edit = function (req, res, next) {
 if(!user.status)return res.render('error.html', {message: '社区只为验证邮件用户开放发布话题服务'});
 if('undefined'===typeof req.xdata)     next();
 var _S = this;
 var id = req.xdata.id;

 D('Blog').model().findById(id, function (err, row) {
 if (err) {
 return res.render('error.html', {message:err});
 }
 if (!row) {
 return res.render('error.html', {message: '非法操作'});
 }
 res.render('blog/edit.html', {todo: row});
 });

 }*/


o.insert = function (req, res, next) {

    var _S = this;

    if (o.blogCuser()) {
        res.json({status: 1, tips: '无权限操作'});
        return;
    }

    var title = req.body.title || '';
    var content = req.body.content || '';
    var tags = req.body.tags || '';
    var status = req.body.status || 0;
    title = title.trim();
    content = content.trim();
    if (!title) {
        //return res.render('error.html', {message: '标题是必须的'});
        res.json({code: 1, tips: "标题是必须的"});
    }
    else if (!content) {
        //return res.render('error.html', {message: '内容不能为空！'});
        res.json({code: 1, tips: "内容不能为空"});
    }
    //重复添加
    D('Blog').count({email: _S.Guser.email, title: title}, function (err, count) {

        if (count > 0) {
            //return res.render('error.html', {message: '存在同标题的内容！'});
            res.json({code: 1, tips: "存在同标题的内容"});
        }
        else {

            var d = {};
            //d.pic=_S.Up.init(req.files.pic);
            d.title = title;
            d.ip = _S.Guser.ip;
            d.email = _S.Guser.email;
            d.author = _S.Guser.name;
            d.content = content;
            d.status = (status == 1) ? true : false;
            d.tags = (tags) ? tags : '';

            D('Blog').insert(d, function (err, row) {
                if (err)return next(err);
                //console.log(row);
                res.json({code: 0, data: row, tips: "添加成功"});
                D('Member').update({email: d.email}, {$inc: {postnum: 1}}, function (r) {
                });
            })
            //res.redirect('/');


        }

    });

}

o.update = function (req, res, next) {
    var _S = this;

    if (o.blogCuser()) {
        res.json({status: 1, tips: '无权限操作'});
        return;
    }

    if ('undefined' !== typeof req.xdata && req.xdata.id != '') {

        var title = req.body.title || '';
        title = title.trim();
        if (!title) {
            return res.render('error.html', {message: '标题是必须的'});
        }
        var d = {};
        var id = req.body._id;
        if ('undefined' !== typeof req.files)d.pic = _S.Up.init(req.files.pic);
        d.title = title;
        d.ip = user.ip;
        d.content = req.body.content;
        d.status = (req.body.status == 1) ? true : false;
        d.updatetime = C.time();


        D('Blog').update({_id: id, email: this.Guser.email}, d, function (err, result) {
            //if (err) return res.render('error.html', {message: '找不到相关资源'});
            if (err)res.json({status: 1, tips: '无权限操作'});
            res.redirect('/blog/userblog/edit/id/' + id);
        });
    }
    else {
        next();
    }
}

o.delete = function (req, res, next) {
    var _S = this;
    var id = req.xdata.id;
    D('Blog').model().findById(id, function (err, row) {

        if (err) {
            //return res.render('error.html', {message: '找不到相关资源'});
            res.json({status: 1, tips: '找不到相关资源'});
        }
        if (o.blogCuser(row.email)) {
            res.json({status: 1, tips: '无权限操作'});
            return;
        }
        D('Blog').delete({_id: id}, function (err) {
            if (err) {
                return next(err);
            }

            D('Member').update({email: row.email}, {$inc: {postnum: -1}}, function (r) {
            });
            if (row.pic != '') {
                fs = require('fs');
                fs.unlink(C.static + row.pic);
            }
            //res.redirect('/');
            res.json({status: 0, tips: '成功删除'});
        });

    });

}

o.blogCuser = function (email) {
    var check = 0;
    if (this.Guser.email != '' || ('undefined' !== typeof email && this.Guser.email == email) || this.Guser.admin) {
        check = 0;
    }
    else {
        check = 1;
    }
    console.log(!this.Guser.email);
    return check;
}


module.exports = o;