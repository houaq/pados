// Current system global object
var system = {
	version:"1.1 Beta"
	,rootPath: "tr-web-control/"
	,codeupdate:"20170523"
	,configHead: "transmission-web-control"
	// default config, can be customized in config.js
	,config:{
		autoReload: true
		,reloadStep: 5000
		,pageSize: 30
		,pagination: true
		,pageList: [10,20,30,40,50,100,150,200,250,300]
		,defaultSelectNode: null
		,autoExpandAttribute: false
		,defaultLang: ""
	}
	,storageKeys: {
		dictionary: {
			folders:"dictionary.folders"
		}
	}
	// Local data storage
	,dictionary:{
		folders: null
	}
	,checkUpdateScript:"https://transmission-control.googlecode.com/svn/resouces/checkupdate.js"
	,contextMenus:{
	}
	,panel:null
	,lang:null
	,reloading:false
	,autoReloadTimer:null
	,downloadDir:""
	,islocal:false
	,B64:new Base64()
	// The currently selected torrent number
	,currentTorrentId:0
	,control:{
		tree:null
		,torrentlist:null
	}
	,userConfig:{
		torrentList: {
			fields:[],
			sortName: null,
			sortOrder: "asc"
		}
	}
	,serverConfig:null
	,serverSessionStats:null
	// Dialog Templates Temporary list
	,templates:{}
	,setlang:function(lang,callback)
	{
		// If no language is specified, acquires the current browser default language
		if (!lang)
		{
			if (this.config.defaultLang)
				lang = this.config.defaultLang;
			else
				lang = navigator.language||navigator.browserLanguage;
			//this.debug("lang",lang);
		}
		if (!lang) lang="zh-CN";

		// If - contains the language code, you need to turn the second half to uppercase
		if (lang.indexOf("-")!=-1)
		{
			// Because Linux file size restrictions
			lang=lang.split("-")[0].toLocaleLowerCase()+"-"+lang.split("-")[1].toLocaleUpperCase();
		}

		// If the language pack is not defined, English is used
		if (!this.languages[lang])
		{
			lang = "en";
		}

		$.getScript(system.rootPath+"lang/"+lang+".js",function(){
			system.lang = $.extend(true,system.defaultLang, system.lang);
			system.resetLangText();
			// Set the easyui language
			$.getScript(system.rootPath+"script/easyui/locale/easyui-lang-"+lang.replace("-","_")+".js")
				.done(function(script, textStatus){
					if (callback)
						callback();
				// If the loading fails, the English language is loaded
				})
				.fail(function(jqxhr, settings, exception) {
					$.getScript(system.rootPath+"script/easyui/locale/easyui-lang-en.js",function(){
						if (callback)
							callback();
				});
			});
		});
	}
	,init:function(lang,islocal,devicetype)
	{
		this.readConfig();
		/*
		 alert(screen.width+","+this.config.mobileDeviceWidth);
		//return;
		if (screen.width<=this.config.mobileDeviceWidth&&devicetype!="computer")
		{
			location.href = "index.mobile.html";
			return;
		}
		*/
		this.islocal = (islocal==1?true:false);
		this.panel = {
			main:$("#main")
			,top:$("#m_top")
			,toolbar:$("#m_toolbar")
			,left_layout:$("#m_left_layout")
			,left:$("#m_left")
			,body:$("#m_body")
			,layout_body:$("#layout_body")
			,list:$("#m_list")
			,attribute:$("#m_attribute")
			,bottom:$("#m_bottom")
			,title:$("#m_title")
			,status:$("#m_status")
			,statusbar:$("#m_statusbar")
			,status_text:$("#status_text")
			,droparea:$("#dropArea")
		};

		if (this.lang==null)
		{
			this.setlang(lang,function(){system.initdata()});
		}
		else
			this.initdata();

	}
	// Set the language information
	,resetLangText:function(parent)
	{
		if (!parent)
			parent = $;
		var items = parent.find("*[system-lang]");

		$.each(items, function(key, item){
			var name = $(item).attr("system-lang");
			if (name.substr(0,1)=="[")
			{
				$(item).html(eval("system.lang"+name));
			}
			else
			{
				$(item).html(eval("system.lang."+name));
			}
		});

		items = parent.find("*[system-tip-lang]");

		$.each(items, function(key, item){
			var name = $(item).attr("system-tip-lang");
			if (name.substr(0,1)=="[")
			{
				$(item).attr("title",eval("system.lang"+name));
			}
			else
			{
				$(item).attr("title",eval("system.lang."+name));
			}

		});
	}
	,initdata:function()
	{
		//this.panel.title.text(this.lang.system.title+" "+this.version+" ("+this.codeupdate+")");
		$(document).attr("title",this.lang.system.title+" "+this.version);

		// The initial navigation bar
		var buttons = new Array();
		var title = "<span>" + this.lang.title.left+"</span>";
		buttons.push("<span class='tree-title-toolbar'>");
		for (var key in this.lang.tree.toolbar.nav)
		{
			var value = this.lang.tree.toolbar.nav[key];
			buttons.push('<a href="javascript:void(0);" id="tree-toolbar-nav-'+key+'" class="easyui-linkbutton" data-options="plain:true,iconCls:\'icon-disabled\'" onclick="javascript:system.navToolbarClick(this);">'+value+"</a>");
		}
		buttons.push("</span>");
		if (buttons.length>1)
		{
			title+=buttons.join("");
			this.panel.left_layout.panel("setTitle",title);
			for (var key in this.lang.tree.toolbar.nav)
			{
				$("#tree-toolbar-nav-"+key).linkbutton();
			}
		}
		else
		{
			this.panel.left_layout.panel("setTitle",title);
		}

		// Initialize the torrent list column title
		title = "<span>" + this.lang.title.list+"</span>";
		buttons.length = 0;
		buttons.push("<span class='tree-title-toolbar'>");
		for (var key in this.lang["torrent-head"].buttons)
		{
			var value = this.lang["torrent-head"].buttons[key];
			buttons.push('<a href="javascript:void(0);" id="torrent-head-buttons-'+key+'" class="easyui-linkbutton" data-options="plain:true,iconCls:\'icon-disabled\'" onclick="javascript:system.navToolbarClick(this);">'+value+"</a>");
		}
		buttons.push("</span>");
		if (buttons.length>1)
		{
			title+=buttons.join("");
			this.panel.body.panel("setTitle",title);
			for (var key in this.lang["torrent-head"].buttons)
			{
				$("#torrent-head-buttons-"+key).linkbutton();
				switch (key)
				{
					case "autoExpandAttribute":
						if (system.config.autoExpandAttribute)
						{
							$("#torrent-head-buttons-"+key).linkbutton({iconCls:"icon-enabled"}).data("status",1);
						}
						else
						{
							$("#torrent-head-buttons-"+key).linkbutton({iconCls:"icon-disabled"}).data("status",0);
						}
						break;

					default:
						break;
				}

			}
		}
		else
		{
			this.panel.body.panel("setTitle",title);
		}

		this.panel.status.panel("setTitle",this.lang.title.status);
		this.panel.attribute.panel({
			title:this.lang.title.attribute
			,onExpand:function()
			{
				if (system.currentTorrentId!=0&&$(this).data("isload"))
				{
					system.getTorrentInfos(system.currentTorrentId);
				}
				else
				{
					system.clearTorrentAttribute();
				}
			}
			,onLoad:function()
			{
				if (!$(this).data("isload"))
				{
					$(this).data("isload",true);
					if (system.currentTorrentId!=0)
					{
						setTimeout(function(){
							system.getTorrentInfos(system.currentTorrentId);
						},500);
					}
				}
			}
		});

		// Set the language
		$.each(this.languages, function(key, value){
			$("<option/>").text(value).val(key).attr("selected",(key==system.lang.name?true:false)).appendTo(system.panel.top.find("#lang"));
		});
		this.panel.top.find("#lang").change(function(){
			location.href = "?lang="+this.value;
		});

		this.panel.toolbar.attr("class","panel-header");
		this.initTree();
		this.initToolbar();
		this.initStatusBar();
		this.initTorrentTable();
		this.connect();
		this.initEvent();
		// Check for updates
		//this.checkUpdate();
	}
	//
	,initEvent:function()
	{
		// When the window size changes
		$(window).resize(function(){
			$("#main").layout("resize");
		});

		// Add file drag-and-drop event handling - Begin
		this.panel.droparea[0].addEventListener("dragover",function(e){
			e.stopPropagation();
			e.preventDefault();
			system.debug("#dropArea.dragover");
		},false);

		this.panel.list[0].addEventListener("dragover",function(e){
			e.stopPropagation();
			e.preventDefault();
			system.panel.droparea.show();
			system.debug("dragover");
		},false);

		this.panel.droparea[0].addEventListener("drop",function(e){
			e.stopPropagation();
			e.preventDefault();
			system.panel.droparea.hide();
			system.debug("drop.e.dataTransfer:",e.dataTransfer);
			system.checkDropFiles(e.dataTransfer.files);
		},false);

		this.panel.droparea[0].addEventListener("dragleave",function(e){
			e.stopPropagation();
			e.preventDefault();
			system.panel.droparea.hide();
			system.debug("dragleave");
		},false);

		$("#text-drop-title").html(this.lang["public"]["text-drop-title"]);
		// End

	}
	// Navigation toolbar Click Events
	,navToolbarClick:function(source)
	{
		var key = source.id;
		var status = $(source).data("status");
		var treenode = null;
		switch (key)
		{
			case "tree-toolbar-nav-folders":
				treenode = this.panel.left.tree("find","folders");
				break;

			case "tree-toolbar-nav-statistics":
				treenode = this.panel.left.tree("find","statistics");
				break;

			case "torrent-head-buttons-autoExpandAttribute":
				treenode = {};
				treenode.target = null;
				if (status==1){
					this.config.autoExpandAttribute = false;
				}
				else
				{
					this.config.autoExpandAttribute = true;
				}
				break;

		}

		if (!treenode)
		{
			return;
		}

		if (status==1)
		{
			$(source).linkbutton({iconCls:"icon-disabled"});
			$(treenode.target).parent().hide();
			status = 0;
		}
		else
		{
			$(source).linkbutton({iconCls:"icon-enabled"});
			$(treenode.target).parent().show();
			status = 1;
		}

		$(source).data("status",status);
		this.saveConfig();
	}
	// Check the dragged files
	,checkDropFiles:function(sources)
	{
		if (!sources || !sources.length) return;
		var files = new Array();
		for (var i = 0; i < sources.length; i++) {
			var file = sources[i];
			if ((file.name.split(".")).pop().toLowerCase()=="torrent")
				files.push(file);
		}

		if (files.length>0)
		{
			system.openDialogFromTemplate({
				id: "dialog-torrent-addfile",
				options: {
					title: system.lang.toolbar["add-torrent"],
					width: 620,
					height: 300,
					resizable: true
				},
				datas: {
					"files": files
				}
			});
		}
	}
	// Initialize the tree list
	,initTree:function()
	{
		this.panel.left.tree({
			data: [{
				id:"torrent-all"
				,iconCls:"icon-home"
				,text: this.lang.tree.all+" ("+this.lang.tree.status.loading+")"
				,children:[
					{
						id: "downloading"
						,text: this.lang.tree.downloading
						,iconCls:"icon-download"
					}
					,{
						id:"paused"
						,text: this.lang.tree.paused
						,iconCls:"icon-pause"
					}
					,{
						id:"sending"
						,text: this.lang.tree.sending
						,iconCls:"icon-seed"
					}
					,{
						id:"check"
						,text: this.lang.tree.check
						,iconCls:"icon-check"
					}
					,{
						id:"actively"
						,text: this.lang.tree.actively
						,iconCls:"icon-actively"
					}
					,{
						id:"error"
						,text: this.lang.tree.error
						,iconCls:"icon-error"
					}
					,{
						id:"warning"
						,text: this.lang.tree.warning
						,iconCls:"icon-warning"
					}
				]
			}
			,{
				id:"servers"
				,text:this.lang.tree.servers
				,state:"closed"
				,iconCls:"icon-servers"
				,children:[
					{
						id:"servers-loading"
						,text:this.lang.tree.status.loading
						,iconCls:"tree-loading"
					}
				]
			}
			,{
				id:"folders"
				,text:this.lang.tree.folders
				,children:[
					{
						id:"folders-loading"
						,text:this.lang.tree.status.loading
						,iconCls:"tree-loading"
					}
				]
			}
			,{
				id:"statistics"
				,text:this.lang.tree.statistics.title
				,state:"closed"
				,iconCls:"icon-chart"
				,children:[
					{
						id:"cumulative-stats"
						,text:this.lang.tree.statistics.cumulative
						,children:[
							{
								id:"uploadedBytes"
								,text:this.lang.tree.statistics.uploadedBytes
							}
							,{
								id:"downloadedBytes"
								,text:this.lang.tree.statistics.downloadedBytes
							}
							,{
								id:"filesAdded"
								,text:this.lang.tree.statistics.filesAdded
							}
							,{
								id:"sessionCount"
								,text:this.lang.tree.statistics.sessionCount
							}
							,{
								id:"secondsActive"
								,text:this.lang.tree.statistics.secondsActive
							}
						]
					}
					,{
						id:"current-stats"
						,text:this.lang.tree.statistics.current
						,children:[
							{
								id:"current-uploadedBytes"
								,text:this.lang.tree.statistics.uploadedBytes
							}
							,{
								id:"current-downloadedBytes"
								,text:this.lang.tree.statistics.downloadedBytes
							}
							,{
								id:"current-filesAdded"
								,text:this.lang.tree.statistics.filesAdded
							}
							,{
								id:"current-sessionCount"
								,text:this.lang.tree.statistics.sessionCount
							}
							,{
								id:"current-secondsActive"
								,text:this.lang.tree.statistics.secondsActive
							}
						]
					}
				]
			}

		]
		,onSelect:function(node){
			system.loadTorrentToList({node:node});
		}
		,lines:true
		});

		for (var key in this.lang.tree.toolbar.nav)
		{
			var treenode = this.panel.left.tree("find",key);
			$(treenode.target).parent().hide();
		}

		// node that specifies the default selection
		if (this.config.defaultSelectNode)
		{
			var node = this.panel.left.tree("find",this.config.defaultSelectNode);
			if (node)
			{
				this.panel.left.tree("select", node.target);
			}
		}
	}
	// Initialize the torrent list display table
	,initTorrentTable:function()
	{
		this.control.torrentlist = $("<table/>").attr("class","torrent-list").appendTo(this.panel.list);
		var headContextMenu = null;
		var selectedIndex = -1;
		var flag_onselect = false;
		$.get(system.rootPath+"template/torrent-fields.json?time="+(new Date()),function(data){
			var fields = data.fields;
			if (system.userConfig.torrentList.fields.length!=0)
			{
				fields = system.userConfig.torrentList.fields;
			}

			var _fields = JSON.stringify(fields);
			// User field settings
			system.userConfig.torrentList.fields = JSON.parse(_fields);

			for (var key in fields)
			{
				fields[key].title = system.lang.torrent.fields[fields[key].field]||fields[key].field;
				system.setFieldFormat(fields[key]);
			}

			system.control.torrentlist.datagrid({
				autoRowHeight:false
				,pagination:system.config.pagination
				,rownumbers:true
				,remoteSort:false
				,checkOnSelect:false
				,pageSize:system.config.pageSize
				,pageList:system.config.pageList
				,idField:"id"
				,fit: true
				,striped:true
				,sortName: system.userConfig.torrentList.sortName
				,sortOrder: system.userConfig.torrentList.sortOrder
				,drophead:true
				,columns:[fields]
				,onCheck:function(rowIndex, rowData)
				{
					system.checkTorrentRow(rowIndex,rowData);
				}
				,onUncheck:function(rowIndex, rowData)
				{
					system.checkTorrentRow(rowIndex,rowData);
				}
				,onCheckAll:function(rows)
				{
					system.checkTorrentRow("all",false);
				}
				,onUncheckAll:function(rows)
				{
					system.checkTorrentRow("all",true);
				}
				,onSelect:function(rowIndex, rowData)
				{
					if (selectedIndex!=-1) {
						flag_onselect = true;
						system.control.torrentlist.datagrid("unselectRow",selectedIndex);
						flag_onselect = false;
					}

					if (system.config.autoExpandAttribute)
					{
						// If it is not expanded, expand it
						if (system.panel.attribute.panel("options").collapsed)
							system.panel.layout_body.layout("expand","south");
					}
					system.getTorrentInfos(rowData.id);
					selectedIndex = rowIndex;
				}
				,onUnselect:function(rowIndex, rowData)
				{
					if (system.config.autoExpandAttribute)
					{
						if (flag_onselect==false) {
							// If expanded, collapse it
							if (!system.panel.attribute.panel("options").collapsed)
								system.panel.layout_body.layout("collapse","south");
						}
					}
					system.currentTorrentId = 0;
					selectedIndex = -1;
				}
				// Before loading data
				,onBeforeLoad:function(param)
				{
					system.currentTorrentId = 0;
				}
				// Header sorting
				,onSortColumn:function(field, order)
				{
					var field_func = field;
					if(field == "remainingTime") { field_func = "remainingTimeRaw"; }
					var datas = system.control.torrentlist.datagrid("getData").originalRows.sort(arrayObjectSort(field_func,order));
					system.control.torrentlist.datagrid("loadData",datas);

					system.resetTorrentListFieldsUserConfig(system.control.torrentlist.datagrid("options").columns[0]);
					system.userConfig.torrentList.sortName = field;
					system.userConfig.torrentList.sortOrder = order;
					system.saveUserConfig();
				}
				,onRowContextMenu: function(e, rowIndex, rowData)
				{
					//console.log("onRowContextMenu");
					system.control.torrentlist.datagrid("uncheckAll");
					system.control.torrentlist.datagrid("checkRow",rowIndex);
					e.preventDefault();
					system.showContextMenu("torrent-list",e);

				},
				onHeadDrop: function(sourceField,targetField)
				{
					//console.log("onHeadDrop");
					system.resetTorrentListFieldsUserConfig(system.control.torrentlist.datagrid("options").columns[0]);
					system.saveUserConfig();
				},
				onResizeColumn: function(field, width)
				{
					system.resetTorrentListFieldsUserConfig(system.control.torrentlist.datagrid("options").columns[0]);
					system.saveUserConfig();
				},
				onHeaderContextMenu: function(e, field) {
					//console.log("onHeaderContextMenu");
					e.preventDefault();
					if (!headContextMenu) {
						createHeadContextMenu();
					}
					headContextMenu.menu('show', {
						left: e.pageX,
						top: e.pageY
					});
				}
			});
		},"json");

		// Create a header right-click menu
		function createHeadContextMenu() {
			if (headContextMenu)
			{
				$(headContextMenu).remove();
			}
			headContextMenu = $('<div/>').appendTo('body');
			headContextMenu.menu({
				onClick: function(item) {
					if (item.iconCls == 'icon-ok') {
						system.control.torrentlist.datagrid('hideColumn', item.name);
						headContextMenu.menu('setIcon', {
							target: item.target,
							iconCls: 'icon-empty'
						});
					} else {
						system.control.torrentlist.datagrid('showColumn', item.name);
						headContextMenu.menu('setIcon', {
							target: item.target,
							iconCls: 'icon-ok'
						});
					}
					system.resetTorrentListFieldsUserConfig(system.control.torrentlist.datagrid("options").columns[0]);
					system.saveUserConfig();
				}
			});
			var fields = system.control.torrentlist.datagrid('getColumnFields');
			for (var i = 0; i < fields.length; i++) {
				var field = fields[i];
				var col = system.control.torrentlist.datagrid('getColumnOption', field);
				if (col.allowCustom!=false&&col.allowCustom!="false")
				{
					headContextMenu.menu('appendItem', {
						text: col.title,
						name: field,
						iconCls: (col.hidden?"icon-empty":"icon-ok")
					});
				}
			}
		}
		/*
		this.panel.list.bind('contextmenu',function(e){
			 e.preventDefault();
			 system.showContextMenu("torrent-list",e);
		});
		*/
	}
	,resetTorrentListFieldsUserConfig: function(columns)
	{
		var fields = {};
		$.each(this.userConfig.torrentList.fields,function(index,item){
			fields[item.field] = item;
		});

		this.userConfig.torrentList.fields = [];
		$.each(columns,function(index,item){
			var field = $.extend({},fields[item.field]);
			field.width = item.width;
			field.hidden = item.hidden;
			system.userConfig.torrentList.fields.push(field);
		});
	}
	// Show context menu
	,showContextMenu: function(type,e)
	{
		var parent = this.contextMenus[type];
		if (!parent)
		{
			parent = $("<div/>").attr("class","easyui-menu").css({"width":"180px"}).appendTo(this.panel.main);
			this.contextMenus[type] = parent;
			parent.menu();
		}
		else
		{
			parent.empty();
		}
		var menus = null;

		switch (type)
		{
			case "torrent-list":
				menus = new Array("start","pause","-","rename","remove","recheck","-","morepeers","changeDownloadDir"
									,"-","menu-queue-move-top","menu-queue-move-up","menu-queue-move-down"
									,"menu-queue-move-bottom");
				var toolbar = this.panel.toolbar;
				for (var item in menus)
				{
					var key = menus[item];
					if (key=="-")
					{
						$("<div class='menu-sep'></div>").appendTo(parent);
					}
					else
					{
						var menu = toolbar.find("#toolbar_"+key);
						if (menu.length>0)
						{
							parent.menu("appendItem",{
								text: menu.attr("title")
								,id: key
								,iconCls: menu.linkbutton("options").iconCls
								,disabled: menu.linkbutton("options").disabled
								,onclick: function(){
									system.panel.toolbar.find("#toolbar_"+$(this).attr("id")).click();
								}
							});
						}
						else
						{
							menu = $("#"+key);
							if (menu.length>0)
							{
								parent.menu("appendItem",{
									text: menu.attr("title")
									,id: key
									,iconCls: menu.attr("id").replace("menu","icon")
									,disabled: toolbar.find("#toolbar_changeDownloadDir").linkbutton("options").disabled
									,onclick: function(){
										$("#"+$(this).attr("id")).click();
									}
								});
							}
						}
						menu = null;
					}
				}
				break;
		}
		parent.menu("show",{left: e.pageX, top: e.pageY});
		parent = null;
		menus = null;
	}
	,checkTorrentRow:function(rowIndex, rowData)
	{
		this.panel.toolbar.find("#toolbar_start").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_pause").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_rename").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_remove").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_recheck").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_changeDownloadDir").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_morepeers").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_queue").menubutton("enable");
		return;
		/*
		if (rowIndex=="all")
		{
			this.panel.toolbar.find("#toolbar_start").linkbutton({disabled:rowData});
			this.panel.toolbar.find("#toolbar_pause").linkbutton({disabled:rowData});
			this.panel.toolbar.find("#toolbar_rename").linkbutton({disabled:rowData});
			this.panel.toolbar.find("#toolbar_remove").linkbutton({disabled:rowData});
			this.panel.toolbar.find("#toolbar_recheck").linkbutton({disabled:rowData});
			this.panel.toolbar.find("#toolbar_changeDownloadDir").linkbutton({disabled:rowData});
			this.panel.toolbar.find("#toolbar_morepeers").linkbutton({disabled:rowData});
			return;
		}
		var rows = this.control.torrentlist.datagrid("getChecked");
		if (rows.length==0)
		{
			this.panel.toolbar.find("#toolbar_start").linkbutton({disabled:true});
			this.panel.toolbar.find("#toolbar_pause").linkbutton({disabled:true});
			this.panel.toolbar.find("#toolbar_rename").linkbutton({disabled:true});
			this.panel.toolbar.find("#toolbar_remove").linkbutton({disabled:true});
			this.panel.toolbar.find("#toolbar_recheck").linkbutton({disabled:true});
			this.panel.toolbar.find("#toolbar_changeDownloadDir").linkbutton({disabled:true});
			this.panel.toolbar.find("#toolbar_morepeers").linkbutton({disabled:true});
			this.panel.toolbar.find("#toolbar_queue").menubutton("disable");
			return;
		}

		this.panel.toolbar.find("#toolbar_remove").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_rename").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_changeDownloadDir").linkbutton({disabled:false});
		this.panel.toolbar.find("#toolbar_queue").menubutton("enable");

		var torrent = transmission.torrents.all[rowData.id];
		switch (torrent.status)
		{
			case transmission._status.stopped:
				this.panel.toolbar.find("#toolbar_start").linkbutton({disabled:false});
				this.panel.toolbar.find("#toolbar_pause").linkbutton({disabled:true});
				this.panel.toolbar.find("#toolbar_recheck").linkbutton({disabled:false});
				this.panel.toolbar.find("#toolbar_morepeers").linkbutton({disabled:true});
				break;

			case transmission._status.check:
			case transmission._status.checkwait:
				this.panel.toolbar.find("#toolbar_start").linkbutton({disabled:true});
				this.panel.toolbar.find("#toolbar_pause").linkbutton({disabled:true});
				this.panel.toolbar.find("#toolbar_recheck").linkbutton({disabled:true});
				this.panel.toolbar.find("#toolbar_morepeers").linkbutton({disabled:true});
				break;

			default:
				this.panel.toolbar.find("#toolbar_start").linkbutton({disabled:true});
				this.panel.toolbar.find("#toolbar_pause").linkbutton({disabled:false});
				this.panel.toolbar.find("#toolbar_recheck").linkbutton({disabled:true});
				this.panel.toolbar.find("#toolbar_morepeers").linkbutton({disabled:false});
				break;
		}
		*/
	}
	// Initialize the System Toolbar
	,initToolbar:function()
	{
		// refresh time
		this.panel.toolbar.find("#toolbar_label_reload_time").html(this.lang.toolbar["reload-time"]);
		this.panel.toolbar.find("#toolbar_label_reload_time_unit").html(this.lang.toolbar["reload-time-unit"]);
		this.panel.toolbar.find("#toolbar_reload_time").numberspinner(
		{
			value:this.config.reloadStep/1000
			,min:3
			,disabled:!this.config.autoReload
			,onChange:function()
			{
				var value = this.value;
				if ($.isNumeric(value))
				{
					system.config.reloadStep = value * 1000;
					system.saveConfig();
				}
			}
		});

		// Enable / disable auto-refresh
		this.panel.toolbar.find("#toolbar_autoreload")
			.linkbutton({text:(this.config.autoReload?this.lang.toolbar["autoreload-enabled"]:this.lang.toolbar["autoreload-disabled"]),iconCls:(this.config.autoReload?"icon-enabled":"icon-disabled")})
			.attr("title",(this.config.autoReload?this.lang.toolbar.tip["autoreload-disabled"]:this.lang.toolbar.tip["autoreload-enabled"]))
			.click(function(){
				if (system.config.autoReload)
				{
					system.config.autoReload = false;
					clearTimeout(system.autoReloadTimer);
					system.panel.toolbar.find("#toolbar_reload_time").numberspinner("disable");
				}
				else
				{
					system.config.autoReload = true;
					system.reloadData();
					system.panel.toolbar.find("#toolbar_reload_time").numberspinner("enable");
				}
				system.saveConfig();

				$(this).linkbutton({text:(system.config.autoReload?system.lang.toolbar["autoreload-enabled"]:system.lang.toolbar["autoreload-disabled"]),iconCls:(system.config.autoReload?"icon-enabled":"icon-disabled")})
				.attr("title",(system.config.autoReload?system.lang.toolbar.tip["autoreload-disabled"]:system.lang.toolbar.tip["autoreload-enabled"]));
			});

		// Add torrents
		this.panel.toolbar.find("#toolbar_add_torrents")
			.linkbutton({text:this.lang.toolbar["add-torrent"],disabled:false})
			.attr("title",this.lang.toolbar.tip["add-torrent"])
			.click(function(){
				system.openDialogFromTemplate({
					id: "dialog-torrent-add",
					options: {
						title: system.lang.toolbar["add-torrent"],
						width: 620,
						height: 400,
						resizable: true
					}
				});
			});

		// Start all
		this.panel.toolbar.find("#toolbar_start_all")
			//.linkbutton({text:this.lang.toolbar["start-all"],disabled:false})
			.linkbutton({disabled:false})
			.attr("title",this.lang.toolbar.tip["start-all"])
			.click(function(){
				var button = $(this);
				var icon = button.linkbutton("options").iconCls;
				button.linkbutton({disabled:true,iconCls:"icon-loading"});
				transmission.exec({method:"torrent-start"},function(data){
					button.linkbutton({iconCls:icon,disabled:false});
					button = null;
				});
			});

		// Pause all
		this.panel.toolbar.find("#toolbar_pause_all")
			//.linkbutton({text:this.lang.toolbar["pause-all"],disabled:false})
			.linkbutton({disabled:false})
			.attr("title",this.lang.toolbar.tip["pause-all"])
			.click(function(){
				var button = $(this);
				var icon = button.linkbutton("options").iconCls;
				button.linkbutton({disabled:true,iconCls:"icon-loading"});
				transmission.exec({method:"torrent-stop"},function(data){
					button.linkbutton({iconCls:icon,disabled:false});
					button = null;
				});
			});

		// Start Selected
		this.panel.toolbar.find("#toolbar_start")
			.linkbutton({disabled:true})
			.attr("title",this.lang.toolbar.tip["start"])
			.click(function(){
				system.changeSelectedTorrentStatus("start",$(this));
			});

		// Pause Selected
		this.panel.toolbar.find("#toolbar_pause")
			.linkbutton({disabled:true})
			.attr("title",this.lang.toolbar.tip["pause"])
			.click(function(){
				system.changeSelectedTorrentStatus("stop",$(this));
			});

		// Recalculate selected
		this.panel.toolbar.find("#toolbar_recheck")
			.linkbutton({disabled:true})
			.attr("title",this.lang.toolbar.tip["recheck"])
			.click(function(){
				var rows = system.control.torrentlist.datagrid("getChecked");
				if (rows.length>0)
				{
					if (rows.length==1)
					{
						var torrent = transmission.torrents.all[rows[0].id];
						if (torrent.percentDone>0)
						{
							if (confirm(system.lang.toolbar.tip["recheck-confirm"]))
							{
								system.changeSelectedTorrentStatus("verify",$(this));
							}
						}
						else
						{
							system.changeSelectedTorrentStatus("verify",$(this));
						}
					}
					else if (confirm(system.lang.toolbar.tip["recheck-confirm"]))
					{
						system.changeSelectedTorrentStatus("verify",$(this));
					}
				}
			});

		// Get more peers
		this.panel.toolbar.find("#toolbar_morepeers")
			.linkbutton({disabled:true})
			.click(function(){
				system.changeSelectedTorrentStatus("reannounce",$(this));
			});

		// Deletes the selected
		this.panel.toolbar.find("#toolbar_remove")
			.linkbutton({disabled:true})
			.attr("title",this.lang.toolbar.tip["remove"])
			.click(function()
			{
				var rows = system.control.torrentlist.datagrid("getChecked");
				var ids = new Array();
				for (var i in rows)
				{
					ids.push(rows[i].id);
				}
				if (ids.length==0) return;

				system.openDialogFromTemplate({
					id: "dialog-torrent-remove-confirm",
					options: {
						title: system.lang.dialog["torrent-remove"].title,
						width: 350,
						height: 150
					},
					datas: {
						"ids": ids
					}
				});
			});

		// Renames the selected
		this.panel.toolbar.find("#toolbar_rename")
			.linkbutton({disabled:true})
			.click(function()
			{
				var rows = system.control.torrentlist.datagrid("getChecked");
				if (rows.length==0) return;

				system.openDialogFromTemplate({
					id: "dialog-torrent-rename",
					options: {
						title: system.lang.dialog["torrent-rename"].title,
						width: 450,
						height: 150,
						resizable: true
					},
					datas: {
						id: rows[0].id
					}
				});
			});

		// Modify the selected torrent data save directory
		this.panel.toolbar.find("#toolbar_changeDownloadDir")
		.linkbutton({disabled:true})
		.attr("title",this.lang.toolbar.tip["change-download-dir"])
		.click(function()
		{
			var rows = system.control.torrentlist.datagrid("getChecked");
			var ids = new Array();
			for (var i in rows)
			{
				ids.push(rows[i].id);
			}
			if (ids.length==0) return;

			system.openDialogFromTemplate({
				id: "dialog-torrent-changeDownloadDir",
				options: {
					title: system.lang.dialog["torrent-changeDownloadDir"].title,
					width: 520,
					height: 200
				},
				datas: {
					"ids": ids
				}
			});
		});

		// Speed limit
		this.panel.toolbar.find("#toolbar_alt_speed")
			.linkbutton()
			.attr("title",this.lang.toolbar.tip["alt-speed"])
			.click(function(){
				var button = $(this);
				var options = button.linkbutton("options");
				var enabled = false;
				if (options.iconCls=="icon-alt-speed-false")
				{
					enabled = true;
				}
				transmission.exec(
					{
						method:"session-set"
						,arguments:{"alt-speed-enabled":enabled}
					}
					,function(data){
						if (data.result=="success")
						{
							system.serverConfig["alt-speed-enabled"] = enabled;
							button.linkbutton({iconCls:"icon-alt-speed-"+enabled.toString()});
							if (enabled)
							{
								$("#status_alt_speed").show();
							}
							else
							{
								$("#status_alt_speed").hide();
							}
						}
					}
				);

				button.linkbutton({iconCls:"icon-loading"});
			});

		// configuration
		this.panel.toolbar.find("#toolbar_config")
			.linkbutton()
			.attr("title",this.lang.toolbar.tip["system-config"])
			.click(function(){
				system.openDialogFromTemplate({
					id: "dialog-system-config",
					options: {
						title: system.lang.toolbar["system-config"],
						width: 620,
						height: 440,
						resizable: true
					}
				});
			});

		// reload
		this.panel.toolbar.find("#toolbar_reload")
			.linkbutton()
			.attr("title",this.lang.toolbar.tip["system-reload"])
			.click(function(){
				system.reloadData();
			});

		// search
		this.panel.toolbar.find("#toolbar_search").searchbox(
		{
			searcher:function(value){
				system.searchTorrents(value);
			},
			prompt:this.lang.toolbar["search-prompt"]
		});
	}
	// Initialize the status bar
	,initStatusBar:function()
	{
		this.panel.statusbar.find("#status_title_downloadspeed").html(this.lang.statusbar.downloadspeed);
		this.panel.statusbar.find("#status_title_uploadspeed").html(this.lang.statusbar.uploadspeed);
	}
	// connect to the server
	,connect:function()
	{
		this.showStatus(this.lang.system.status.connect,0);

		// When the total torrent number is changed, the torrent information is retrieved
		transmission.on.torrentCountChange = function()
		{
			system.reloadTorrentBaseInfos();
		};
		// When submitting an error
		transmission.on.postError = function()
		{
			//system.reloadTorrentBaseInfos();
		};
		// Initialize the connection
		transmission.init(
			{
				islocal:true
			}
			,function (){
				system.reloadSession(true);
				system.getServerStatus();
			}
		);
	}
	// Reload the server information
	,reloadSession:function(isinit)
	{
		transmission.getSession(function(result)
		{
			system.serverConfig = result;
			// Version Information
			$("#status_version").html("Transmission "+system.lang.statusbar.version+result["version"]+", RPC: "+result["rpc-version"]
				+", WEB Control: "+system.version+"("+system.codeupdate+")");
			if (result["alt-speed-enabled"]==true)
			{
				system.panel.toolbar.find("#toolbar_alt_speed").linkbutton({iconCls:"icon-alt-speed-true"});
				$("#status_alt_speed").show();
			}
			else
			{
				system.panel.toolbar.find("#toolbar_alt_speed").linkbutton({iconCls:"icon-alt-speed-false"});
				$("#status_alt_speed").hide();
			}

			system.downloadDir = result["download-dir"];

			// Always push default download dir to the Dirs array
			if (transmission.downloadDirs.length==0)
			{
				transmission.downloadDirs.push(system.downloadDir);
			}

			// Rpc-version version 15, no longer provide download-dir-free-space parameters, to be obtained from the new method
			if (parseInt(system.serverConfig["rpc-version"])>=15)
			{
				transmission.getFreeSpace(system.downloadDir,function(datas){
					system.serverConfig["download-dir-free-space"] = datas.arguments["size-bytes"];
					system.showFreeSpace(datas.arguments["size-bytes"]);
				});
			}
			else
			{
				system.showFreeSpace(system.serverConfig["download-dir-free-space"]);
			}

			if (isinit)
			{
				system.showStatus(system.lang.system.status.connected);
			}
		});
	}
	,showFreeSpace:function(size)
	{
		var tmp = size;
		if (tmp==-1)
		{
			tmp = system.lang["public"]["text-unknown"];
		}
		else
		{
			tmp = formatSize(tmp);
		}
		$("#status_freespace").text(system.lang.dialog["system-config"]["download-dir-free-space"]+" "+tmp);
	}
	// Retrieve the torrent information again
	,reloadTorrentBaseInfos:function(ids, moreFields)
	{
		if (this.reloading) return;
		clearTimeout(this.autoReloadTimer);
		this.reloading = true;
		var oldInfos = {
			trackers:transmission.trackers
			,folders:transmission.torrents.folders
		}

		// Gets all the torrent id information
		transmission.torrents.getallids(function(resultTorrents)
		{
			var ignore = new Array();
			for (var index in resultTorrents)
			{
				var item = resultTorrents[index];
				ignore.push(item.id);
			}

			// Error numbered list
			var errorIds = transmission.torrents.getErrorIds(ignore,true);

			if (errorIds.length>0)
			{
				transmission.torrents.getallids(function(){
					system.resetTorrentInfos(oldInfos);
				},errorIds);
			}
			else
			{
				system.resetTorrentInfos(oldInfos);
			}
		},ids, moreFields);
	}
	// refresh the tree
	,resetTorrentInfos:function(oldInfos)
	{
		var currentTorrentId = this.currentTorrentId;
		var parentNode = this.panel.left.tree("find","servers");
		if (parentNode)
		{
			var parentNode_collapsed = parentNode.state
			this.removeTreeNode("servers-loading");
		}
		else
		{
			this.appendTreeNode(null,[{
					id:"servers"
					,text:this.lang.tree.servers
					,state:"closed"
					,iconCls:"icon-servers"
				}]);
			parentNode = this.panel.left.tree("find","servers");
		}

		var datas = new Array();
		for (var index in transmission.trackers)
		{
			var tracker = transmission.trackers[index];
			var node = system.panel.left.tree("find",tracker.nodeid);
			var text = tracker.name+this.showNodeMoreInfos(tracker.count,tracker.size);
			if (node)
			{
				system.updateTreeNodeText(tracker.nodeid,text,(tracker.connected?"icon-server":"icon-server-error"));
			}
			else
			{
				system.appendTreeNode(parentNode,[{
					id:tracker.nodeid
					,text:text
					,iconCls:(tracker.connected?"icon-server":"icon-server-error")
				}]);
			}

			oldInfos.trackers[tracker.nodeid] = null;
		}
		// Collapse the node if it was before
		if (parentNode_collapsed == "closed")
			{
				this.panel.left.tree("collapse", parentNode.target);
			}

		// Delete the server that no longer exists
		for (var index in oldInfos.trackers)
		{
			var tracker = oldInfos.trackers[index];
			if (tracker)
			{
				system.removeTreeNode(tracker.nodeid);
			}
		}

		// Paused
		if (transmission.torrents.status[transmission._status.stopped])
		{
			system.updateTreeNodeText("paused",system.lang.tree.paused+this.showNodeMoreInfos(transmission.torrents.status[transmission._status.stopped].length));
		}
		else
		{
			system.updateTreeNodeText("paused",system.lang.tree.paused);
		}

		// Seeding
		if (transmission.torrents.status[transmission._status.seed])
		{
			system.updateTreeNodeText("sending",system.lang.tree.sending+this.showNodeMoreInfos(transmission.torrents.status[transmission._status.seed].length));
		}
		else
		{
			system.updateTreeNodeText("sending",system.lang.tree.sending);
		}
		// Waiting for seed
		if (transmission.torrents.status[transmission._status.seedwait])
		{
			var node = system.panel.left.tree("find","sending");
			var childs = system.panel.left.tree("getChildren",node.target);
			var text = system.lang.tree.wait+this.showNodeMoreInfos(transmission.torrents.status[transmission._status.seedwait].length);
			if (childs.length>0)
			{
				system.updateTreeNodeText(childs[0].id,text);
			}
			else
			{
				system.appendTreeNode(node,[{id:"seedwait",text:text,iconCls:"icon-wait"}]);
			}
		}
		else
		{
			system.removeTreeNode("seedwait");
		}

		// check
		if (transmission.torrents.status[transmission._status.check])
		{
			system.updateTreeNodeText("check",system.lang.tree.check+this.showNodeMoreInfos(transmission.torrents.status[transmission._status.check].length));
		}
		else
		{
			system.updateTreeNodeText("check",system.lang.tree.check);
		}
		// Waiting for check
		if (transmission.torrents.status[transmission._status.checkwait])
		{
			var node = system.panel.left.tree("find","check");
			var childs = system.panel.left.tree("getChildren",node.target);
			var text = system.lang.tree.wait+this.showNodeMoreInfos(transmission.torrents.status[transmission._status.checkwait].length);
			if (childs.length>0)
			{
				system.updateTreeNodeText(childs[0].id,text);
			}
			else
			{
				system.appendTreeNode(node,[{id:"checkwait",text:text,iconCls:"icon-wait"}]);
			}
		}
		else
		{
			system.removeTreeNode("checkwait");
		}

		// downloading
		if (transmission.torrents.status[transmission._status.download])
		{
			system.updateTreeNodeText("downloading",system.lang.tree.downloading+this.showNodeMoreInfos(transmission.torrents.status[transmission._status.download].length));
		}
		else
		{
			system.updateTreeNodeText("downloading",system.lang.tree.downloading);
		}
		// Waiting for download
		if (transmission.torrents.status[transmission._status.downloadwait])
		{
			var node = system.panel.left.tree("find","downloading");
			var childs = system.panel.left.tree("getChildren",node.target);
			var text = system.lang.tree.wait+this.showNodeMoreInfos(transmission.torrents.status[transmission._status.downloadwait].length);
			if (childs.length>0)
			{
				system.updateTreeNodeText(childs[0].id,text);
			}
			else
			{
				system.appendTreeNode(node,[{id:"downloadwait",text:text,iconCls:"icon-wait"}]);
			}
		}
		else
		{
			system.removeTreeNode("downloadwait");
		}

		// Active
		system.updateTreeNodeText("actively",system.lang.tree.actively+this.showNodeMoreInfos(transmission.torrents.actively.length));
		// With error
		system.updateTreeNodeText("error",system.lang.tree.error+this.showNodeMoreInfos(transmission.torrents.error.length));
		// With warning
		system.updateTreeNodeText("warning",system.lang.tree.warning+this.showNodeMoreInfos(transmission.torrents.warning.length));

		var node = system.panel.left.tree("getSelected");
		if (node!=null)
		{
			var p = system.control.torrentlist.datagrid("options").pageNumber;
			system.loadTorrentToList({node:node,page:p});
		}

		if (currentTorrentId!=0)
		{
			system.control.torrentlist.datagrid("selectRecord",currentTorrentId);
		}

		system.reloading = false;

		if (system.config.autoReload)
		{
			system.autoReloadTimer = setTimeout(function(){system.reloadData();},system.config.reloadStep);
		}

		// Total count
		system.updateTreeNodeText("torrent-all",system.lang.tree.all+this.showNodeMoreInfos(transmission.torrents.count,transmission.torrents.totalSize));

		// Statistics
		var items = ("uploadedBytes,downloadedBytes,filesAdded,sessionCount,secondsActive").split(",");
		$.each(items, function(key, item){
			switch (item)
			{
				case "uploadedBytes":
				case "downloadedBytes":
					system.updateTreeNodeText(item,system.lang.tree.statistics[item]+formatSize(system.serverSessionStats["cumulative-stats"][item]));
					system.updateTreeNodeText("current-"+item,system.lang.tree.statistics[item]+formatSize(system.serverSessionStats["current-stats"][item]));
					break;
				case "secondsActive":
					system.updateTreeNodeText(item,system.lang.tree.statistics[item]+getTotalTime(system.serverSessionStats["cumulative-stats"][item]*1000));
					system.updateTreeNodeText("current-"+item,system.lang.tree.statistics[item]+getTotalTime(system.serverSessionStats["current-stats"][item]*1000));
					break;
				default:
					system.updateTreeNodeText(item,system.lang.tree.statistics[item]+system.serverSessionStats["cumulative-stats"][item]);
					system.updateTreeNodeText("current-"+item,system.lang.tree.statistics[item]+system.serverSessionStats["current-stats"][item]);
					break;
			}
		});

		for (var index in transmission.torrents.folders)
		{
			var item = transmission.torrents.folders[index];
			oldInfos.folders[item.nodeid] = null;
		}

		// Loads the directory listing
		this.loadFolderList(oldInfos.folders);

		// FF browser displays the total size, will be moved down a row, so a separate treatment
		if (navigator.userAgent.indexOf("Firefox")>0)
		{
			system.panel.left.find("span.nav-total-size").css({"margin-top":"-19px"});
		}
	}
	// Displays the current torrent count and size
	,showNodeMoreInfos:function(count,size)
	{
		var result = "";
		if (count>0)
		{
			result = " <span class='nav-torrents-number'>("+count+")</span>";
		}
		if (size>0)
		{
			result += "<span class='nav-total-size'>["+formatSize(size)+"]</span>";
		}

		return result;
	}
	// Gets the current state of the server
	,getServerStatus:function()
	{
		if (this.reloading) return;
		clearTimeout(this.autoReloadTimer);

		this.reloading = true;
		transmission.getStatus(function(data){
			system.reloading=false;
			//system.updateTreeNodeText("torrent-all",system.lang.tree.all+" ("+data["torrentCount"]+")");
			//system.updateTreeNodeText("paused",system.lang.tree.paused+(data["pausedTorrentCount"]==0?"":" ("+data["pausedTorrentCount"]+")"));
			//system.updateTreeNodeText("sending",system.lang.tree.sending+(data["activeTorrentCount"]==0?"":" ("+data["activeTorrentCount"]+")"));
			$("#status_downloadspeed").html(formatSize(data["downloadSpeed"],false,"speed"));
			$("#status_uploadspeed").html(formatSize(data["uploadSpeed"],false,"speed"));
			system.serverSessionStats = data;
			if (data["torrentCount"]==0)
			{
				var parentNode = system.panel.left.tree("find","servers");
				if (parentNode)
				{
					system.panel.left.tree('remove',parentNode.target);
				}
				system.updateTreeNodeText("torrent-all",system.lang.tree.all);
			}
		});
	}
	// Displays status information
	,showStatus:function(msg,outtime){
		if ($("#m_status").panel("options").collapsed)
		{
			$("#layout_left").layout("expand","south");
		}
		this.panel.status_text.show();
		this.panel.status_text.html(msg);
		if (outtime==0)
		{
			return;
		}
		if (outtime==undefined)
		{
			outtime=3000;
		}
		this.panel.status_text.fadeOut(outtime,function(){
			$("#layout_left").layout("collapse","south");
		});
	}
	// Updates the tree node text
	,updateTreeNodeText:function(id,text,iconCls)
	{
		var node = this.panel.left.tree("find",id);
		if (node)
		{
			var data = {
				target: node.target,
				text: text
			};

			if (iconCls!=undefined)
			{
				data["iconCls"] = iconCls
			}
			this.panel.left.tree("update", data);
		}
		node = null;
	}
	// Append tree nodes
	,appendTreeNode:function(parentid,data)
	{
		var parent = null;
		if (typeof(parentid)=="string")
		{
			parent = this.panel.left.tree("find",parentid);
		}
		else
			parent = parentid;

		if (parent)
		{
			this.panel.left.tree("append", {
				parent: parent.target,
				data: data
			});
		}
		else
		{
			this.panel.left.tree("append", {
				data: data
			});
		}
		parent = null;
	}
	// Remove tree nodes
	,removeTreeNode:function(id)
	{
		var node = this.panel.left.tree("find",id);
		if (node)
		{
			this.panel.left.tree("remove", node.target);
		}
		node = null;
	}
	// Load the torrent list
	,loadTorrentToList:function(config)
	{
		if (!transmission.torrents.all)
		{
			return;
		}
		var def = {
			node:null
			,page:1
		};

		jQuery.extend(def, config);
		if (!config.node) return;

		var torrents = null;
		var parent = this.panel.left.tree("getParent",config.node.target)||{id:""};
		var currentNodeId = this.panel.left.data("currentNodeId");

		if (currentNodeId!=config.node.id)
		{
			this.control.torrentlist.datagrid({pageNumber:1});
			currentNodeId = config.node.id;
		}
		this.panel.left.data("currentNodeId",currentNodeId);

		switch (parent.id)
		{
		case "servers":
			torrents = transmission.trackers[config.node.id].torrents;
			break;
		default:
			switch (config.node.id)
			{
				case "torrent-all":
				case "servers":
					torrents = transmission.torrents.all;
					break;
				case "paused":
					torrents = transmission.torrents.status[transmission._status.stopped];
					break;
				case "sending":
					torrents = transmission.torrents.status[transmission._status.seed];
					break;

				case "seedwait":
					torrents = transmission.torrents.status[transmission._status.seedwait];
					break;

				case "check":
					torrents = transmission.torrents.status[transmission._status.check];
					break;
				case "checkwait":
					torrents = transmission.torrents.status[transmission._status.checkwait];
					break;

				case "downloading":
					torrents = transmission.torrents.status[transmission._status.download];
					break;
				case "downloadwait":
					torrents = transmission.torrents.status[transmission._status.downloadwait];
					break;

				case "actively":
					torrents = transmission.torrents.actively;
					break;

				case "error":
					torrents = transmission.torrents.error;
					break;

				case "warning":
					torrents = transmission.torrents.warning;
					break;

				case "search-result":
					torrents = transmission.torrents.searchResult;
					break;

				default:
					// Categories
					if (config.node.id.indexOf("folders-")!=-1)
					{
						var folder = transmission.torrents.folders[config.node.id];
						if (folder)
						{
							torrents = folder.torrents;
						}
					}
					break;
			}
			break;
		}

		if (this.config.defaultSelectNode!=config.node.id)
		{
			this.control.torrentlist.datagrid("loadData",[]);
			this.config.defaultSelectNode = config.node.id;
			this.saveConfig();
		};

		var datas = new Array();
		for (var index in torrents)
		{
			if (!torrents[index])
			{
				return;
			}
			var status = this.lang.torrent["status-text"][torrents[index].status];
			var percentDone = parseFloat(torrents[index].percentDone*100).toFixed(2);
			// Checksum, the use of verification progress
			if (status==transmission._status.check)
			{
				percentDone = parseFloat(torrents[index].recheckProgress*100).toFixed(2);
			}

			if (torrents[index].error!=0)
			{
				status = "<span class='text-status-error'>"+status+"</span>";
			}
			else if (torrents[index].warning)
			{
				status = "<span class='text-status-warning' title='"+torrents[index].warning+"'>"+status +"</span>";
			}
			var data = {};
			data = $.extend(data,torrents[index]);
			data.status = status;
			data.statusCode = torrents[index].status;
			data.completeSize = Math.max(0,torrents[index].totalSize-torrents[index].leftUntilDone);
			data.leecherCount = torrents[index].leecher;
			data.seederCount = torrents[index].seeder;
			//data.leecherCount = torrents[index].leecher;
			/*
			datas.push({
				id:torrents[index].id
				,name:torrents[index].name
				,totalSize:torrents[index].totalSize
				,percentDone:torrents[index].percentDone
				,remainingTime:torrents[index].remainingTime
				,status:status
				,statusCode:torrents[index].status
				,addedDate:torrents[index].addedDate
				,completeSize:(torrents[index].totalSize-torrents[index].leftUntilDone)
				,rateDownload:torrents[index].rateDownload
				,rateUpload:torrents[index].rateUpload
				,leecherCount:torrents[index].leecher
				,seederCount:torrents[index].seeder
				,uploadRatio:torrents[index].uploadRatio
				,uploadedEver:torrents[index].uploadedEver
			});
			*/

			datas.push(data);
		}
		/*
		this.panel.toolbar.find("#toolbar_start").linkbutton({disabled:true});
		this.panel.toolbar.find("#toolbar_pause").linkbutton({disabled:true});
		this.panel.toolbar.find("#toolbar_remove").linkbutton({disabled:true});
		this.panel.toolbar.find("#toolbar_recheck").linkbutton({disabled:true});
		this.panel.toolbar.find("#toolbar_changeDownloadDir").linkbutton({disabled:true});
		this.panel.toolbar.find("#toolbar_morepeers").linkbutton({disabled:true});
		this.panel.toolbar.find("#toolbar_queue").menubutton("disable");
		*/

		this.updateTorrentCurrentPageDatas(datas);
	}
	// Update torrent list current page data
	,updateTorrentCurrentPageDatas: function(currentTypeDatas)
	{

		// Get the current page data
		var rows = this.control.torrentlist.datagrid("getRows");

		if (currentTypeDatas.length==0&&rows.length>0)
		{
			this.control.torrentlist.datagrid("loadData",[]);
			return;
		}

		var _options = this.control.torrentlist.datagrid("options");
		var orderField = null;
		if (_options.sortName)
		{
			orderField = _options.sortName;
			var orderField_func = orderField;
			if(orderField == "remainingTime") { orderField_func = "remainingTimeRaw"; }
			currentTypeDatas = currentTypeDatas.sort(arrayObjectSort(orderField_func,_options.sortOrder));
		}

		if (rows.length==0||(currentTypeDatas.length!=this.control.torrentlist.datagrid("getData").total)&&currentTypeDatas.length>_options.pageSize)
		{
			this.control.torrentlist.datagrid({
				loadFilter:pagerFilter
				,pageNumber:_options.pageNumber
				,sortName:orderField
				,sortOrder:_options.sortOrder
			}).datagrid("loadData",currentTypeDatas);
			return;
		}

		// Setting data
		this.control.torrentlist.datagrid("getData").originalRows = currentTypeDatas;
		var start = (_options.pageNumber-1)*parseInt(_options.pageSize);
		var end = start + parseInt(_options.pageSize);
		currentTypeDatas = (currentTypeDatas.slice(start, end));

		//this.debug("currentTypeDatas:",currentTypeDatas);

		// Current updated torrent list
		var recently = {};
		//
		var datas = {};

		// Initializes the most recently updated data
		for (var index in transmission.torrents.recently)
		{
			var item = transmission.torrents.recently[index];
			recently[item.id] = true;
			item = null;
		}

		// Initializes the data under the current type
		for (var index in currentTypeDatas)
		{
			var item = currentTypeDatas[index];
			datas[item.id] = item;
			item = null;
		}

		//this.debug("datas:",datas);
		//this.debug("recently:",recently);
		//this.debug("rows:",rows);

		var addedDatas = {};
		// Update the changed data
		for (var index=rows.length-1;index>=0;index--)
		{
			var item = rows[index];
			var data = datas[item.id];
			if (!data)
			{
				this.control.torrentlist.datagrid("deleteRow",index);
			}
			else if (recently[item.id])
			{
				this.control.torrentlist.datagrid("updateRow",{
					index: index
					,row:data
				});
				addedDatas[item.id] = item;
			}
			// Removes the currently deleted torrent
			else if (transmission.torrents.removed)
			{
				if (transmission.torrents.removed.length>0&&$.inArray(item.id,transmission.torrents.removed)!=-1)
				{
					this.control.torrentlist.datagrid("deleteRow",index);
				}
				else
				{
					addedDatas[item.id] = item;
				}
			}
			else
			{
				addedDatas[item.id] = item;
			}
			item = null;
			data = null;
		}


		// Appends a row that does not currently exist
		for (var index in currentTypeDatas)
		{
			var item = currentTypeDatas[index];
			if (!addedDatas[item.id])
			{
				this.control.torrentlist.datagrid("appendRow",item);
			}
		}

		rows = null;
		recently = null;
		datas = null;
	}
	// Gets the contents of the torrent name display area
	,getTorrentNameBar:function(torrent)
	{
		var className = "";
		var tip = torrent.name;
		switch (torrent.status)
		{
			case transmission._status.stopped:
				className = "iconlabel icon-pause-small";
				break;

			case transmission._status.check:
				className = "iconlabel icon-checking";
				break;

			case transmission._status.download:
				className = "iconlabel icon-down";
				break;

			case transmission._status.seed:
				className = "iconlabel icon-up";
				break;

			case transmission._status.seedwait:
			case transmission._status.downloadwait:
			case transmission._status.checkwait:
				className = "iconlabel icon-wait";
			break;
		}

		tip+="\n"+torrent.downloadDir;

		if (torrent.warning)
		{
			className = "iconlabel icon-warning-type1";
			tip+="\n\n"+this.lang["public"]["text-info"]+": "+torrent.warning;
		}

		if (torrent.error!=0)
		{
			className = "iconlabel icon-exclamation";
			tip+="\n\n"+this.lang["public"]["text-info"]+": "+torrent.errorString;
		}


		return '<span class="'+className+'" title="'+tip+'">'+torrent.name+'</span>';
	}
	// Gets the progress bar for the specified torrent
	,getTorrentProgressBar:function(progress,torrent)
	{
		progress=progress+"%";
		var className = "";
		var status = 0;
		if (typeof(torrent)=="object")
		{
			status = torrent.status;
		}
		else
		{
			status = torrent;
		}
		switch (status)
		{
		case transmission._status.stopped:
			className = "torrent-progress-stop";
			break;

		case transmission._status.checkwait:
		case transmission._status.check:
			className = "torrent-progress-check";
			break;

		case transmission._status.downloadwait:
		case transmission._status.download:
			className = "torrent-progress-download";
			break;

		case transmission._status.seedwait:
		case transmission._status.seed:
			className = "torrent-progress-seed";
			break;
		}
		if (typeof(torrent)=="object")
		{
			if (torrent.warning)
			{
				className = "torrent-progress-warning";
			}
			if (torrent.error!=0)
			{
				className = "torrent-progress-error";
			}
		}
		return '<div class="torrent-progress" title="'+progress+'"><div class="torrent-progress-text">'+progress+'</div><div class="torrent-progress-bar '+className+'" style="width:'+progress+';"></div></div>';
	}
	// Add torrent
	,addTorrentsToServer:function(urls,count,autostart,savepath)
	{
		//this.config.autoReload = false;
		var index = count-urls.length;
		var url = urls.shift();
		if (!url)
		{
			this.showStatus(this.lang.system.status.queuefinish);
			//this.config.autoReload = true;
			this.getServerStatus();
			return;
		}
		this.showStatus(this.lang.system.status.queue+(index+1)+"/"+(count) + "<br/>" + url,0);
		transmission.addTorrentFromUrl(url,savepath,autostart,function(data){
			system.addTorrentsToServer(urls,count,autostart,savepath);
		});
	}
	// Starts / pauses the selected torrent
	,changeSelectedTorrentStatus:function(status,button,method)
	{
		var rows = this.control.torrentlist.datagrid("getChecked");
		var ids = new Array();
		if (!status)
		{
			status = "start";
		}
		for (var i in rows)
		{
			ids.push(rows[i].id);
		}

		if (!method)
		{
			method = "torrent-"+status;
		}
		if (ids.length>0)
		{
			if (button)
			{
				var icon = button.linkbutton("options").iconCls;
				button.linkbutton({disabled:true,iconCls:"icon-loading"});
			}

			transmission.exec({
					method:method
					,arguments:{
						ids:ids
					}
				}
				,function(data){
					if (button)
					{
						button.linkbutton({iconCls:icon});
					}
					system.control.torrentlist.datagrid("uncheckAll");
					system.reloadTorrentBaseInfos();
				}
			);
		}
	}
	// Looks for the specified torrent from the torrent list
	,searchTorrents:function(key)
	{
		if (key=="")
		{
			return;
		}
		var result = transmission.torrents.search(key);
		if (result==null||result.length==0)
		{
			this.removeTreeNode("search-result");
			return;
		}

		var node = this.panel.left.tree("find","search-result");
		var text = this.lang.tree["search-result"]+" : "+key+" ("+result.length+")";
		if (node==null)
		{
			this.appendTreeNode("torrent-all",[{id:"search-result",text:text,iconCls:"icon-search"}]);
			node = this.panel.left.tree("find","search-result");
		}
		else
		{
			this.panel.left.tree("update",{target:node.target,text:text});
		}
		this.panel.left.tree("select",node.target);
	}
	// Get the torrent details
	,getTorrentInfos:function(id)
	{
		if (!transmission.torrents.all[id]) return;
		if (transmission.torrents.all[id].infoIsLoading) return;
		if (this.currentTorrentId>0&&transmission.torrents.all[this.currentTorrentId])
		{
			if (transmission.torrents.all[this.currentTorrentId].infoIsLoading) return;
		}
		this.currentTorrentId = id;
		// Loads only when expanded
		if (!this.panel.attribute.panel("options").collapsed)
		{
			//this.panel.attribute.panel({iconCls:"icon-loading"});
			var torrent = transmission.torrents.all[id];
			torrent.infoIsLoading = true;
			var fields = "fileStats,trackerStats,peers,leftUntilDone,status,rateDownload,rateUpload,uploadedEver,uploadRatio,error,errorString";
			// If this is the first time to load this torrent information, load more information
			if (!torrent.moreInfosTag)
			{
				fields += ",files,trackers,comment,dateCreated,creator,downloadDir";
			}

			// Gets the list of files
			transmission.torrents.getMoreInfos(fields,id,function(result){
				torrent.infoIsLoading = false;
				//system.panel.attribute.panel({iconCls:""});
				if (result==null) return;
				// Merge the currently returned value to the current torrent
				jQuery.extend(torrent, result[0]);
				if (system.currentTorrentId==0||system.currentTorrentId!=id)
				{
					system.clearTorrentAttribute();
					return;
				}

				torrent.completeSize = (torrent.totalSize-torrent.leftUntilDone);
				torrent.moreInfosTag = true;
				system.fillTorrentBaseInfos(torrent);
				system.fillTorrentFileList(torrent);
				system.fillTorrentServerList(torrent);
				system.fillTorrentPeersList(torrent);
				system.fillTorrentConfig(torrent);
				transmission.torrents.all[id] = torrent;
				transmission.torrents.datas[id] = torrent;
			});
		}
	}
	,clearTorrentAttribute:function()
	{
		system.panel.attribute.find("#torrent-files-table").datagrid("loadData",[]);
		system.panel.attribute.find("#torrent-servers-table").datagrid("loadData",[]);
		system.panel.attribute.find("#torrent-peers-table").datagrid("loadData",[]);
		system.panel.attribute.find("span[id*='torrent-attribute-value']").html("");
	}
	// Updates the specified current page count
	,updateCurrentPageDatas:function(keyField,datas,sourceTable)
	{
		// Get the current page data
		var rows = sourceTable.datagrid("getRows");
		var _options = sourceTable.datagrid("options");
		var orderField = null;
		if (_options.sortName)
		{
			orderField = _options.sortName;
			datas = datas.sort(arrayObjectSort(orderField,_options.sortOrder));
		}

		if (rows.length==0||(datas.length!=sourceTable.datagrid("getData").total)&&datas.length>_options.pageSize)
		{
			sourceTable.datagrid({
				loadFilter:pagerFilter
				,pageNumber:1
				,sortName:orderField
				,sortOrder:_options.sortOrder
			}).datagrid("loadData",datas);
			return;
		}

		// Setting data
		sourceTable.datagrid("getData").originalRows = datas;
		var start = (_options.pageNumber-1)*parseInt(_options.pageSize);
		var end = start + parseInt(_options.pageSize);
		datas = (datas.slice(start, end));

		var newDatas = {};
		// Initializes the data under the current type
		for (var index in datas)
		{
			var item = datas[index];
			newDatas[item[keyField]] = item;
			item = null;
		}

		// Update the changed data
		for (var index=rows.length-1;index>=0;index--)
		{
			var item = rows[index];

			var data = newDatas[item[keyField]];

			if (data)
			{
				sourceTable.datagrid("updateRow",{
					index: index
					,row:data
				});
			}
			else
			{
				sourceTable.datagrid("deleteRow",index);
			}
			data = null;

			item = null;
		}
	}
	// Fill the seed with basic information
	,fillTorrentBaseInfos:function(torrent)
	{
		$.each(torrent, function(key, value){
			switch (key)
			{
				// Speed
				case "rateDownload":
				case "rateUpload":
					value = formatSize(value,true,"speed");
					break;

				// Size
				case "totalSize":
				case "uploadedEver":
				case "leftUntilDone":
				case "completeSize":
					value = formatSize(value);
					break;

				// Dates
				case "addedDate":
				case "dateCreated":
				case "doneDate":
					value = formatLongTime(value);
					break;

				// status
				case "status":
					value = system.lang.torrent["status-text"][value];
					break;
				// error
				case "error":
					if (value==0)
					{
						system.panel.attribute.find("#torrent-attribute-tr-error").hide();
					}
					else
					{
						system.panel.attribute.find("#torrent-attribute-tr-error").show();
					}
					break;

				// description
				case "comment":
					value = system.replaceURI(value);
					break;

			}
			system.panel.attribute.find("#torrent-attribute-value-"+key).html(value);
		});
	}
	// Fill the torrent with a list of files
	,fillTorrentFileList:function(torrent)
	{
		var files = torrent.files;
		var fileStats = torrent.fileStats;
		var datas = new Array();
		var namelength = torrent.name.length+1;
		for (var index in files)
		{
			var file = files[index];
			var stats = fileStats[index];
			var percentDone = parseFloat(stats.bytesCompleted/file.length*100).toFixed(2);
			datas.push({
				name:(file.name==torrent.name?file.name:file.name.substr(namelength))
				,index:index
				,bytesCompleted:stats.bytesCompleted
				,percentDone:system.getTorrentProgressBar(percentDone,transmission._status.download)
				,length:file.length
				,wanted:system.lang.torrent.attribute["status"][stats.wanted]
				,priority:'<span class="iconlabel icon-flag-'+stats.priority+'">'+system.lang.torrent.attribute["priority"][stats.priority]+'</span>'
			});
		}

		this.updateCurrentPageDatas("index",datas,system.panel.attribute.find("#torrent-files-table"));

	}
	// Fill in the torrent server list
	,fillTorrentServerList:function(torrent)
	{
		var trackers = torrent.trackers;
		var trackerStats = torrent.trackerStats;
		var datas = new Array();
		for (var index in trackers)
		{
			var item = trackers[index];
			var stats = trackerStats[index];
			var rowdata = {};
			for (var key in stats)
			{
				switch (key)
				{
					// Dates
					case "lastAnnounceTime":
					case "nextAnnounceTime":
						rowdata[key] = formatLongTime(stats[key]);
						break;

					// true/false
					case "lastAnnounceSucceeded":
					case "lastAnnounceTimedOut":
						rowdata[key] = system.lang.torrent.attribute["status"][stats[key]];
						break;

					default:
						rowdata[key] = stats[key];
						break;
				}
			}

			datas.push(rowdata);
		}
		// Replace the tracker information
		transmission.torrents.addTracker(torrent);

		this.updateCurrentPageDatas("id",datas,system.panel.attribute.find("#torrent-servers-table"));
		//console.log("datas:",datas);
		//system.panel.attribute.find("#torrent-servers-table").datagrid({loadFilter:pagerFilter,pageNumber:1}).datagrid("loadData",datas);
	}
	// Fill the torrent user list
	,fillTorrentPeersList:function(torrent)
	{
		var peers = torrent.peers;
		var datas = new Array();
		for (var index in peers)
		{
			var item = peers[index];
			var rowdata = {};
			for (var key in item)
			{
				rowdata[key] = item[key];
			}
			var percentDone = parseFloat(item.progress*100).toFixed(2);
			rowdata.progress = system.getTorrentProgressBar(percentDone,transmission._status.download)
			datas.push(rowdata);
		}

		this.updateCurrentPageDatas("address",datas,system.panel.attribute.find("#torrent-peers-table"));
		//console.log("datas:",datas);
		//system.panel.attribute.find("#torrent-peers-table").datagrid({loadFilter:pagerFilter,pageNumber:1}).datagrid("loadData",datas);
	}
	// Fill torrent parameters
	,fillTorrentConfig:function(torrent)
	{
		if (system.panel.attribute.find("#torrent-attribute-tabs").data("selectedIndex")!=4)
		{
			return;
		}
		transmission.torrents.getConfig(torrent.id,function(result){
			if (result==null) return;

			var torrent = transmission.torrents.all[system.currentTorrentId];
			// Merge the currently returned value to the current torrent
			jQuery.extend(torrent, result[0]);
			if (system.currentTorrentId==0) return;
			$.each(result[0], function(key, value){
				var indeterminate = false;
				var checked = false;
				var useTag = false;
				switch (key)
				{
					//
					case "seedIdleMode":
					case "seedRatioMode":
						if (value==0)
						{
							checked = false;
							indeterminate = true;
						}
						useTag = true;
					case "downloadLimited":
					case "uploadLimited":
						if (value==true||value==1)
						{
							checked = true;
						}

						system.panel.attribute.find("input[enabledof='"+key+"']").prop("disabled",!checked);
						if (useTag)
						{
							system.panel.attribute.find("#"+key).prop("indeterminate",indeterminate).data("_tag",value)
						}
						system.panel.attribute.find("#"+key).prop("checked",checked);

						break;

					default:
						system.panel.attribute.find("#"+key).val(value);
						system.panel.attribute.find("#"+key).numberspinner("setValue",value);
						break;

				}
			});
		});
	}
	// Set the field display format
	,setFieldFormat:function(field)
	{
		if (field.formatter)
		{
			switch (field.formatter)
			{
			case "size":
				field.formatter =  function(value,row,index){return formatSize(value);};
				break;
			case "speed":
				field.formatter =  function(value,row,index){return formatSize(value,true,"speed");};
				break;

			case "longtime":
				field.formatter =  function(value,row,index){return formatLongTime(value);};
				break;

			case "progress":
				field.formatter =  function(value,row,index){
					var percentDone = parseFloat(value*100).toFixed(2);
					return system.getTorrentProgressBar(percentDone,transmission.torrents.all[row["id"]]);
				};
				break;

			case "_usename_":
				switch (field.field)
				{
				case "name":
					field.formatter =  function(value,row,index){
						return system.getTorrentNameBar(transmission.torrents.all[row["id"]]);
					};
					break;
				}
				break;

			}
		}
	}
	// Reload the data
	,reloadData:function()
	{
		this.reloadSession();
		this.reloading=false;
		this.getServerStatus();
		this.reloading=false;
		this.reloadTorrentBaseInfos();
		// enable all icons
		this.checkTorrentRow("all",false);
	}
	// Loads the directory listing
	,loadFolderList:function(oldFolders)
	{
		this.removeTreeNode("folders-loading");
		// Delete the directory that does not exist
		for (var index in oldFolders)
		{
			var item = oldFolders[index];
			if (item)
			{
				system.removeTreeNode(item.nodeid);
			}
		}
		if (transmission.downloadDirs.length==0)
		{
			return;
		}

		timedChunk(transmission.downloadDirs, this.appendFolder, this, 10, function(){
			// FF browser displays the total size, will be moved down a row, so a separate treatment
			if (navigator.userAgent.indexOf("Firefox")>0)
			{
				system.panel.left.find("span.nav-total-size").css({"margin-top":"-19px"});
			}


		});
		/*
		for (var index in transmission.downloadDirs)
		{
			var parentkey = rootkey;
			var fullkey = transmission.downloadDirs[index];

		}*/
	}
	,appendFolder:function(fullkey)
	{
		if (!fullkey) return;

		var rootkey = "folders";
		var parentkey = rootkey;
		var folder = fullkey.split("/");
		var key = rootkey + "-";
		for (var i in folder)
		{
			var name = folder[i];
			if (name=="")
			{
				continue;
			}
			//key += "--" + text.replace(/\./g,"。") + "--";
			key += this.B64.encode(name);
			var node = this.panel.left.tree("find",key);
			var folderinfos = transmission.torrents.folders[key];
			var text = name+this.showNodeMoreInfos(folderinfos.count,folderinfos.size);

			if (!node)
			{
				this.appendTreeNode(parentkey,[{id:key,text:text}]);
				if (parentkey!=rootkey)
				{
					node = this.panel.left.tree("find",parentkey);
					this.panel.left.tree("collapse",node.target);
				}
			}
			else
			{
				this.updateTreeNodeText(key, text);
			}
			parentkey = key;
		}
	}
	,replaceURI:function(text)
	{
		var reg = /(http|https|ftp):\/\/([^/:]+)(:\d*)?([^# ]*)/ig;
		return text.replace(reg,function(url){return '<a href="'+url+'" target="_blank">'+url+'</a>';});
	}
	// Load the parameters from cookies
	,readConfig:function()
	{
		this.readUserConfig();
		var config = cookies.get(this.configHead);
		if ($.isPlainObject(config))
		{
			this.config = $.extend(this.config, config);;
		}

		for (var key in this.storageKeys.dictionary)
		{
			this.dictionary[key] = this.getStorageData(this.storageKeys.dictionary[key]);
		}
	}
	// Save the parameters in cookies
	,saveConfig:function()
	{
		cookies.set(this.configHead,this.config,100);
		for (var key in this.storageKeys.dictionary)
		{
			this.setStorageData(this.storageKeys.dictionary[key],this.dictionary[key]);
		}
		this.saveUserConfig();
	}
	,readUserConfig: function()
	{
		var local = window.localStorage[this.configHead];
		if (local)
		{
			var localOptions = JSON.parse(local);
			this.userConfig = $.extend(true, this.userConfig, localOptions);
		}
	}
	,saveUserConfig: function()
	{
		window.localStorage[this.configHead] = JSON.stringify(this.userConfig);
	}
	// Upload the torrent file
	,uploadTorrentFile: function(fileInputId,savePath,paused,callback)
	{
		// Determines whether the FileReader interface is supported
		if (window.FileReader)
		{
			var files = $("input[id='"+fileInputId+"']")[0].files;
			$.each(files,function(index,file){
				transmission.addTorrentFromFile(file,savePath,paused,callback,files.length);
			});
		}
		else
		{
			alert(system.lang["publit"]["text-browsers-not-support-features"]);
		}
	}
	,checkUpdate: function()
	{
		$.getScript(this.checkUpdateScript,function(){
			if (system.codeupdate<system.lastUpdateInfos.update)
			{
				$("#area-update-infos").show();
				$("#msg-updateInfos").html(system.lastUpdateInfos.update+" -> "+system.lastUpdateInfos.infos);
			}
			else
				$("#area-update-infos").hide();
		});
	}
	// Set the language to reload the page
	,changeLanguages: function(lang)
	{
		if (lang==this.lang.name||!lang) return;

		this.config.defaultLang = lang;
		this.saveConfig();
		location.href = "?lang="+lang;
	}
	,getStorageData: function(key,defaultValue)
	{
		return (window.localStorage[key]==null?defaultValue:window.localStorage[key]);
	}
	,setStorageData: function(key,value)
	{
		window.localStorage[key] = value;
	}
	// Opens the specified template window
	,openDialogFromTemplate: function(config)
	{
		var defaultConfig = {
			id: null,
			options: null,
			datas: null
		};
		config = $.extend(true,defaultConfig, config);

		if (config.id==null) return;

		var dialogId = config.id;
		var options = config.options;
		var datas = config.datas;

		var dialog = $("#"+dialogId);
		if (dialog.length)
		{
			dialog.dialog("open");
			if (datas)
			{
				$.each(datas,function(key,value){
					dialog.data(key,value);
				});
			}


			dialog.dialog({content:system.templates[dialogId]});

			return;
		}
		var defaultOptions = {
			title: "",
			width: 100,
			height: 100,
			resizable: false,
			cache: true,
			content:"loading...",
			modal: true
		};
		options = $.extend(true,defaultOptions, options);

		$("<div/>").attr("id",dialogId).appendTo(document.body).dialog(options);

		$.get(system.rootPath+"template/"+dialogId+".html?time="+(new Date()),function(data){
			system.templates[dialogId] = data;
			if (datas)
			{
				$.each(datas,function(key,value){
					$("#"+dialogId).data(key,value);
				});
			}

			$("#"+dialogId).dialog({content:data});
		});
	}
	// Debugging information
	,debug:function(label,text){
		if (window.console)
		{
			if (window.console.log)
			{
				window.console.log(label,text);
			}
		}
	}
};

$(document).ready(function(){
	// Loads the default language content
	$.getScript(system.rootPath+"lang/default.js");
	// Loads a list of available languages
	$.getScript(system.rootPath+"lang/_languages.js",function(){
		system.init(location.search.getQueryString("lang"),location.search.getQueryString("local"));
	});
});

function pagerFilter(data){
	if (typeof data.length == 'number' && typeof data.splice == 'function'){    // is array
		 data = {
			  total: data.length,
			  rows: data
		 }
	}
	var dg = $(this);
	var opts = dg.datagrid('options');
	var pager = dg.datagrid('getPager');
	var buttons = dg.data("buttons");
	//system.debug("pagerFilter.buttons:",buttons);
	pager.pagination({
		 onSelectPage:function(pageNum, pageSize){
			  opts.pageNumber = pageNum;
			  opts.pageSize = pageSize;
			  pager.pagination('refresh',{
					pageNumber:pageNum,
					pageSize:pageSize
			  });
			  dg.datagrid('loadData',data);
		 }
		 ,buttons:buttons
	});
	if (!data.originalRows){
		 data.originalRows = (data.rows);
	}
	var start = (opts.pageNumber-1)*parseInt(opts.pageSize);
	var end = start + parseInt(opts.pageSize);
	data.rows = (data.originalRows.slice(start, end));
	return data;
}
