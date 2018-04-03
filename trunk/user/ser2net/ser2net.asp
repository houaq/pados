<!DOCTYPE html>
<html>
<head>
<title><#Web_Title#> - 串口转网络</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="-1">

<link rel="shortcut icon" href="images/favicon.ico">
<link rel="icon" href="images/favicon.png">
<link rel="stylesheet" type="text/css" href="/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" type="text/css" href="/bootstrap/css/main.css">
<link rel="stylesheet" type="text/css" href="/bootstrap/css/engage.itoggle.css">

<script type="text/javascript" src="/jquery.js"></script>
<script type="text/javascript" src="/bootstrap/js/bootstrap.min.js"></script>
<script type="text/javascript" src="/bootstrap/js/engage.itoggle.min.js"></script>
<script type="text/javascript" src="/state.js"></script>
<script type="text/javascript" src="/general.js"></script>
<script type="text/javascript" src="/itoggle.js"></script>
<script type="text/javascript" src="/popup.js"></script>
<script type="text/javascript" src="/help.js"></script>
<script>
var $j = jQuery.noConflict();

$j(document).ready(function() {
	init_itoggle('ser2net_enable');
});
</script>
<script>
function initial(){
	show_banner(1);
     show_menu(5,11,6);
	show_footer();
}

function applyRule(){
//	if(validForm()){
		showLoading();
		
		document.form.action_mode.value = " Apply ";
		document.form.current_page.value = "/ser2net.asp";
		document.form.next_page.value = "";
		
		document.form.submit();
//	}
}



function done_validating(action){
	refreshpage();
}


</script>
</head>

<body onload="initial();" onunLoad="return unload_body();">

<div class="wrapper">
    <div class="container-fluid" style="padding-right: 0px">
        <div class="row-fluid">
            <div class="span3"><center><div id="logo"></div></center></div>
            <div class="span9" >
                <div id="TopBanner"></div>
            </div>
        </div>
    </div>

    <div id="Loading" class="popup_bg"></div>

    <iframe name="hidden_frame" id="hidden_frame" src="" width="0" height="0" frameborder="0"></iframe>

    <form method="post" name="form" id="ruleForm" action="/start_apply.htm" target="hidden_frame">

    <input type="hidden" name="current_page" value="ser2net.asp">
    <input type="hidden" name="next_page" value="">
    <input type="hidden" name="next_host" value="">
    <input type="hidden" name="sid_list" value="Storage;General;">
    <input type="hidden" name="group_id" value="">
    <input type="hidden" name="action_mode" value="">
    <input type="hidden" name="action_script" value="">

    <div class="container-fluid">
        <div class="row-fluid">
            <div class="span3">
                <!--Sidebar content-->
                <!--=====Beginning of Main Menu=====-->
                <div class="well sidebar-nav side_nav" style="padding: 0px;">
                    <ul id="mainMenu" class="clearfix"></ul>
                    <ul class="clearfix">
                        <li>
                            <div id="subMenu" class="accordion"></div>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="span9">
                <!--Body content-->
                <div class="row-fluid">
                    <div class="span12">
                        <div class="box well grad_colour_dark_blue">
                            <h2 class="box_head round_top"> 串口转网络</h2>
                            <div class="round_bottom">
                                <div class="row-fluid">
                                    <div id="tabMenu" class="submenuBlock"></div>
                                    <div class="alert alert-info" style="margin: 10px;"> 串口转网络服务。
                                  </div>

                                    <table width="100%" align="center" cellpadding="4" cellspacing="0" class="table">
                                        <tr>
                                            <th width="30%" style="border-top: 0 none;"><a class="help_tooltip" href="javascript: void(0)" onmouseover="openTooltip(this, 26, 9);">启用串口转网络 </a></th>
                                            <td style="border-top: 0 none;">
                                                <div class="main_itoggle">
                                                    <div id="ser2net_enable_on_of">
                                                        <input type="checkbox" id="ser2net_enable_fake" <% nvram_match_x("", "ser2net_enable", "1", "value=1 checked"); %><% nvram_match_x("", "ser2net_enable", "0", "value=0"); %>  />
                                                    </div>
                                                </div>
                                                <div style="position: absolute; margin-left: -10000px;">
                                                    <input type="radio" value="1" name="ser2net_enable" id="ser2net_enable_1" class="input" value="1"  <% nvram_match_x("", "ser2net_enable", "1", "checked"); %> /><#checkbox_Yes#>
                                                    <input type="radio" value="0" name="ser2net_enable" id="ser2net_enable_0" class="input" value="0"  <% nvram_match_x("", "ser2net_enable", "0", "checked"); %> /><#checkbox_No#>
                                                </div>
                                            </td>  											
                                        </tr>                                    
              
                                        <tr id="ser2net_script" colspan="4">
                                            <td colspan="4" style="border-top: 0 none;">
                                                <i class="icon-hand-right"></i> <a href="javascript:spoiler_toggle('script12')"><span>ser2net_script</span><div>&nbsp;<span style="color:#888;">以下脚本可以修改串口转网络服务启动参数</span></div></a>
                                                <div id="script12">
                                                    <textarea rows="20" wrap="off" spellcheck="false" maxlength="18192" class="span12" name="scripts.ser2net_script.sh" style="font-family:'Courier New'; font-size:12px;"><% nvram_dump("scripts.ser2net_script.sh",""); %></textarea>
                                                </div>
                                            </td>
                                        </tr>                                        
                                        <tr>
                                            <td colspan="4" style="border-top: 0 none;">
                                                <br />
                                                <center><input class="btn btn-primary" style="width: 219px" type="button" value="<#CTL_apply#>" onclick="applyRule()" /></center>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </form>
    <div id="footer"></div>
</div>
</body>
</html>

