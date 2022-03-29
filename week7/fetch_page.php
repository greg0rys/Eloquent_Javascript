<!---"CORS"[DEFINE] doesn't allow Javascript to access the webserver without unless it is made excplicitly okay
one way around this is to use php.--->

<!--- begin php code--->

<?php 
	$url = isset($_GET['url']) ? $_GET['url'] : "http://eloquentjavascript.net/";
	$contents = base64_encode(mb_convert_encoding(file_get_contents($url), "HTML-ENTITIES", "UTF-8"));
?>

<!doctype html>
<html>

	<head>
		<meta name="viewport">
		<title> Fetch Page </title>
		<link rel = "stylesheet" href="fetch_page.css">
		<script src="fetch_page.js"></script>
		<script>
			/* have the javascript vairables contain php islands that echo the contents of the php variables ~* which should hold the page that has been fetched and decoded. */
			var BASE = "<?php echo $url; ?>";
			var PAGE ="<?php echo $contents; ?>";
		</script>
	</head>
	
	<body>
		<div id="searchBox">
			Type a URL here: <input type="text" id="urlBox"> <span id="goButton">GO</span>
		</div>
		<div id="tooContainer">
			<!-- [this is just the container for the table of contents where we will center the contents] -->
			<div id="too">
			</div>
		</div>
		<div id="contents">
			<!-- [actual page content will be loaded here] -->
		</div>
	</body>
	
</html>