var o = require('./base');


o.index = function (req, res, next) {

    var _S = this;
    var page = (req.query.p > 0) ? req.query.p : 1;
    var perPage = (req.query.pr < 10) ? req.query.pr : 10;
    var pageList = '';

    //搜索
    var where = {};
    var s = ('undefined' !== typeof req.query.s) ? req.query.s : ('undefined' !== typeof req.xdata.s) ? req.xdata.s : '';
    var s = eval("\/" + s + "\/i");
    if ('undefined' !== typeof s) {
        where.$or = [
            {title: s}
            ,
            {content: s}
            ,
            {tags: s}
        ];
    }
    //where.status = true;
    var op = {};
    op.where = where;
    op.page = page;
    op.perPage = perPage;

    //bysort
    var bysort = ('undefined' !== typeof req.xdata.bysort && req.xdata.bysort != '') ? req.xdata.bysort : '';

    switch (bysort) {
        case 'latest':
            op.sort = {'_id': -1};
            break;
        case 'hot':
            op.sort = {'view': -1};
            break;
        case 'comments':
            op.sort = {'commentnum': -1};
            break;
        default:
            op.sort = {'_id': -1};
            break;
    }


    D('Blog')._list(op, function (err, todos) {

        if (err) return next(err);

        todos.data.forEach(function (vo) {
            vo.creattime = _S.date.dgm(vo.creattime, 'yyyy-mm-dd');
            vo.updatetime = _S.date.dgm(vo.updatetime, 'yyyy-mm-dd');
            if ('undefined' !== typeof vo.email)vo.avatar = _S.encode.md5(vo.email);
            if ('undefined' !== typeof vo.content) {
                vo.content = _S.html.delHtmlTag(vo.content);
                vo.content = vo.content.substring(0, 250);
            }
        })

        pageList = _S.pN.pageNavi(page, todos.count, perPage);

        res.json({
            blogs: todos.data,
            page: pageList
        });

    });
}


o.content = function (req, res, next) {

    var _S = this;
    if ('undefined' !== typeof req.xdata) {
        var id = req.xdata.id;
        D('Blog').model().findById(id, function (err, row) {
            if (err) {
                /*return res.render('error.html', {
                 message: err
                 });*/
                res.json({code: 1, data: err, tips: '非法操作 找不到相关资源'});

            }
            if (!row) {
                /*return res.render('error.html', {
                 message: '非法操作 找不到相关资源'
                 });*/
                res.json({code: 1, data: err, tips: '非法操作 找不到相关资源'});
            }
            else {
                row.creattime = _S.date.format(row.creattime, 'yyyy-mm-dd hh:ii:ss');
                row.updatetime = _S.date.format(row.updatetime, 'yyyy-mm-dd hh:ii:ss');

                row.avatar = _S.encode.md5(row.email);

                /*res.render('blog/content.html', {
                 todo: row,
                 view: row.view + 1
                 });*/

                res.json({blogs: row});
                D('Blog').update({_id: row.id}, {$inc: {view: 1}}, function (r) {
                });
            }


        });
    } else {
        next();
    }
}

o.author = function (req, res, next) {

    if (req.xdata.name == '') {
        next();
    }
    else {
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
        where.author = req.xdata.name;
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
            where = {name: req.xdata.name, status: true};


            D('Member').model().findOne(where, function (err, userinfo) {

                if ('undifined' !== typeof userinfo) {

                    userinfo.avatar = _S.encode.md5(userinfo.email);
                    //res.render('blog/author.html', {todos: todos.data,page:pageList,author:where.author,userinfo:userinfo});
                    res.json({
                        blogs: todos.data,
                        page: pageList,
                        author: userinfo
                    });


                }
                else {
                    next();
                }

            })


        });
    }
}


o.userList = function (req, res, next) {
    var where = {};
    var _S = this;
    // where.postnum ={$gt:0};
    where.status = true;
    var bysort = {'_id': -1};
    var limit = 28;

    //_S.memberDB.findAll(where,28,bysort,function(data){
    D('Member').model().find(where).sort(bysort).limit(limit).exec(function (err, data) {

        data.forEach(function (vo) {
            vo.avatar = _S.encode.md5(vo.email);
            vo.createtime = _S.date.dgm(vo.createtime, 'yyyy-mm-dd hh:ii:ss');
            vo.logintime = _S.date.dgm(vo.logintime, 'yyyy-mm-dd hh:ii:ss');
        })

        D('Member').count({}, function (err, count) {

            // global.userdata = data;//模块全局
            // global.usernum = count;
            var userlist = {};
            userlist.data = data;
            userlist.num = count;
            //
            res.json(userlist);
            //callback(1);
        })

        //app.locals({userdata: data});//模版全局

    });

}

module.exports = o;