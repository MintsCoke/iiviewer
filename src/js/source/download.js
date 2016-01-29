function downloadPages(pages) {
    var client = new XMLHttpRequest();
    client.open('GET', 'compile.php?pages=' + pages);
    client.onreadystatechange = function() {
        var DONE = 4;
        if (client.readyState !== DONE || client.status !== 200) {
            return;
        }
        var downloadFile = client.responseText;
        ga('set', 'page', '/download-' + pages);
        ga('send', 'pageview');
        window.open('./pdf/' + downloadFile, '_self')
    }
    client.send();
}

function onDownloadFavourite() {
    downloadPages(favouritePages.join());
}
document.getElementById('download-favourite').addEventListener('click', onDownloadFavourite);

function onDownloadSection() {
    var downloadSectionElements = document.getElementsByClassName('download-section');
    var pages = '';
    for (var i = 0; i < downloadSectionElements.length; i++) {
        if (downloadSectionElements[i].checked) {
            pages += downloadSectionElements[i].value;
        }
    }
    downloadPages(pages);
}
document.getElementById('download-section').addEventListener('click', onDownloadSection);

function onDownloadSectionCheck() {
    if (this.checked) {
        document.getElementById('section-number').textContent = String(parseInt(document.getElementById('section-number').textContent)+1);
    } else {
        document.getElementById('section-number').textContent = String(parseInt(document.getElementById('section-number').textContent)-1);
    }
}
