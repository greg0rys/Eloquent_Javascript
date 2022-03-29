window.addEventListener("DOMContentLoaded", (function() {
    var contents;

    // these hold the results for converting our relative img paths to absolute paths

    // protocol holds the web pages protocol ie http or https
    var protocol;

    // directory holds the absolute path to the image src. 
    var directory;
    // this will hold the file name 
    var file;

    // this will hold the host name 
    var hostname;

    // this function will parse the baseURL so we can create absolute paths to our images

    var TOC_TAG = "fetch_page_TOC";

    function parseBase() {
        // find the end of the protocol "://" indexOf will return the posistion of the string index. OR if it isn't found it will return (-1)
        var pos, slashPOS;
        pos = BASE.indexOf('://')

        // this will return the name of the protocol by search the string up to the pos
        protocol = BASE.substr(0, pos);

        // this will return the host name by searching everything up to the "://" and adding 3 to its index posistion
        var remainder;
        remainder = BASE.substr(pos + 3);
        slashPOS = remainder.indexOf('/');
        if (slashPOS === -1) {
            hostname = remainder;
            directory = "";
            file = "";
        } else {
            // hostname will be everything UP TO the slash 
            hostname = remainder.substr(0, slashPOS);
            //remainder will be everything AFTER the slash
            remainder = remainder.substr(slashPOS + 1);
            // find the last slash
            slashPOS = remainder.lastIndexOf('/');
            if (slashPOS === -1) {
                directory = "";
                file = remainder;
            } else {
                directory = remainder.substr(0, slashPOS);
                file = remainder.substr(slashPOS + 1);
            }
        }
        console.log("protocol:", protocol);
        console.log(`hostname: ${hostname}`);
        console.log(`directory:${directory}`);
        console.log(`file:${file}`);

    }
    // this function will convert relative urls to absolute urls 
    function relativeToAbsolute(url) {
        /* 
        	3 relative url types we will start working with

        	1.) http://somedomain.com/path/file.html

        	2.) /path/file.html

        	3.) path/file.html

		
        */

        //for case one
        if (url.indexOf('://') > -1) {
            return url;
        } /*for case two*/
        else if (url[0] === '/') {
            return protocol + "://" + hostname + url;
        } /*for case 3*/
        else {
            if (directory === "") {
                return protocol + "://" + hostname + "/" + url;
            } else {
                return protocol + "://" + hostname + "/" + directory + "/" + url;
            }

        }
    }


    function parsePage() {
        var parser = new DOMParser();
        contents = parser.parseFromString(atob(PAGE), "text/html");
        console.log(contents);
    }

    function moveChildren(source, destination) {
        while (source.childNodes.length > 0) {
            var child = source.childNodes[0];
            source.removeChild(child);
            if (child.tagName === 'SCRIPT') {
                var node = document.createElement('script');

                if (child.getAttribute('src')) {
                    node.setAttribute('src', child.getAttribute('src'));
                } else {
                    node.setAttribute('src', 'data:text/javascript;base64,' + btoa(child.innerText));
                }
                destination.appendChild(node);
            } else {
                destination.appendChild(child);
            }
        };
    }
    // this function will fixs the tags by updating their sources:
    fixTags = (tagName, attribute) => {
        var tags = contents.getElementsByTagName(tagName);
        for (var counter = 0; counter < tags.length; counter++) {
            var url = tags[counter].getAttribute(attribute);
            if (url) {
                tags[counter].setAttribute(attribute, relativeToAbsolute(url));
            }
        }
    }

    // this function will fix the anchor tags src attribute
    fixRedirectedTags = (tagName, attribute) => {
        var tags = contents.getElementsByTagName(tagName);
        for (var counter = 0; counter < tags.length; counter++) {
            var url = tags[counter].getAttribute(attribute);
            if (url) {
                tags[counter].setAttribute(attribute,
                    window.location.origin + window.location.pathname + '?url=' + encodeURIComponent(relativeToAbsolute(url)));
            }
        }
    };
    // this function will fix our URLs for our images and links
    fixURLs = () => {
        fixTags('img', 'src');
        fixTags('script', 'src');
        fixTags("link", 'href');
        fixRedirectedTags('a', 'href');

    };
    //#region build table of contents functions
    buildTOC = () => {
        var levels = [0];
        var headers = [];
        var headerCount = 0;


        scrapeText = (node) => {
            if (node.nodeType === document.TEXT_NODE) {
                return node.nodeValue;
            } else {
                var result = "";
                for (var counter = 0; counter < node.childNodes.length; counter++) {
                    result += ' ' + scrapeText(node.childNodes[counter]);
                }
                return result;
            }
        };

        addListItem = (node) => {
            var child = document.createElement('li');
            var anchor = document.createElement('a');
            anchor.href = '#' + TOC_TAG + '_' + headerCount;
            child.appendChild(anchor);
            anchor.innerText = scrapeText(node);
            var span = document.createElement('span');
            span.id = TOC_TAG + '_' + headerCount;
            node.insertBefore(span, node.childNodes[0]);
            anchor = document.createElement('a');
            anchor.href = '#' + TOC_TAG;
            anchor.innerText = '[top]'
            anchor.style.fontSize = '0.5em';
            node.parentNode.insertBefore(anchor, node);
            headers[headers.length - 1].appendChild(child);
            headerCount++;
        };


        addLevel = (node, level) => {
            var child = document.createElement('ul');
            if (headers.length > 0) {
                headers[headers.length - 1].appendChild(child);
            }
            headers.push(child);
            addListItem(node);
            levels.push(level);
        };

        removeLevel = () => {
            headers.pop();
            levels.pop();
        };

        checkNode = (node) => {
            if (node.nodeType !== document.ELEMENT_NODE) {
                return;
            }
            if (node.tagName[0] === 'H' && node.tagName[1] >= '1' && node.tagName[1] <= '6') {
                var level = Number(node.tagName[1]);
                var currentLevel = levels[levels.length - 1];

                if (level > currentLevel) {
                    addLevel(node, level);

                } else if (level === currentLevel) {
                    addListItem(node);

                } else if (level < currentLevel) {
                    while (level < currentLevel) {
                        removeLevel();
                        currentLevel = levels[levels.length - 1];
                    }
                    checkNode(node);
                }
                console.log(node.tagName, node.innerText);
            }
            //recursively check 

            // we need to add an array because its static
            // the slice function with no args will give us a copy of the array.
            var children = [].slice.call(node.childNodes);
            for (var counter = 0; counter < children.length; counter++) {
                checkNode(children[counter]);
            }
        };
        checkNode(contents.body);
        var top = document.createElement("span");
        top.id = TOC_TAG;
        document.getElementById('too').appendChild(top);
        if (headers[0]) {
            document.getElementById('too').appendChild(headers[0]);
        }
    };
    //#endregion

    function moveContent() {
        moveChildren(contents.head, document.head);
        moveChildren(contents.body, document.getElementById("contents"));
        var anchor = document.createElement('a');
        anchor.href = "#" + TOC_TAG;
        anchor.innerText = "[top]";
        anchor.style.fontSize = '0.5em';

        document.getElementById("contents").appendChild(anchor);

    }



    //this function will handle the submit events when a users uses the urlbox
    submit = () => {
        console.log("Success; URI Encoded: \n", encodeURIComponent(document.getElementById('urlBox').value));
        window.location.href = window.location.origin + window.location.pathname + "?url=" + encodeURIComponent(document.getElementById('urlBox').value);
    };


    addEventListeners = () => {
        document.getElementById('goButton').addEventListener('click', submit);
        document.getElementById('urlBox').addEventListener('keydown', (event) => {
            if (event.keyCode == 13 || event.keyCode == 10) {
                submit();
            }
        });
    };
    return function() {
        parseBase();
        parsePage();
        fixURLs();
        buildTOC();
        moveContent();
        addEventListeners();
    }


})())