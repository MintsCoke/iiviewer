function onViewContents() {
    if (isViewContents) {
        document.getElementById('contents').style.display = 'none';
    } else {
        document.getElementById('contents').style.display = 'block';
    }
    isViewContents = ! isViewContents;
}
document.getElementById('view-contents').addEventListener('click', onViewContents);

function onViewList() {
    if (isViewList) {
        return;
    }
    document.getElementById('contents-list').style.display = 'block';
    document.getElementById('contents-thumbnail').style.display = 'none';
    document.getElementById('contents-title').innerHTML = document.getElementById('contents-title').dataset.listTitle;
    isViewList = true;
}
document.getElementById('view-list').addEventListener('click', onViewList);

function onViewThumbnail() {
    if ( ! isViewList) {
        return;
    }
    document.getElementById('contents-list').style.display = 'none';
    document.getElementById('contents-thumbnail').style.display = 'block';
    document.getElementById('contents-title').innerHTML = document.getElementById('contents-title').dataset.thumbnailTitle;
    isViewList = false;
}
document.getElementById('view-thumbnail').addEventListener('click', onViewThumbnail);

function onViewSingle() {
    if ( ! isViewDouble) {
        return;
    }
    document.getElementById('single-page').style.display = 'table-cell';
    document.getElementById('double-page').style.display = 'none';
    scale *= 2;
    isViewDouble = false;
    queueRenderPage(pageNum);
}
document.getElementById('view-single').addEventListener('click', onViewSingle);

function onViewDouble() {
    if (isViewDouble) {
        return;
    }
    document.getElementById('single-page').style.display = 'none';
    document.getElementById('double-page').style.display = 'table-cell';
    scale *= 0.5;
    isViewDouble = true;
    queueRenderPage(pageNum);
}
document.getElementById('view-double').addEventListener('click', onViewDouble);

function onViewSearch() {
    toggleRightPanel('search');
}
document.getElementById('view-search').addEventListener('click', onViewSearch);


function onViewDownload() {
    toggleRightPanel('download');
}
document.getElementById('view-download').addEventListener('click', onViewDownload);

function onViewShare() {
    toggleRightPanel('share');
}
document.getElementById('view-share').addEventListener('click', onViewShare);

function toggleRightPanel(name) {
    document.getElementById('search').style.display = 'none';
    document.getElementById('download').style.display = 'none';
    document.getElementById('share').style.display = 'none';
    if (name === 'search') {
        isViewSearch = ! isViewSearch;
        isViewDownload = false;
        isViewShare = false;
        if (isViewSearch) {
            document.getElementById('search').style.display = 'block';
        }
    } else if (name === 'download') {
        isViewSearch = false;
        isViewDownload = ! isViewDownload;
        isViewShare = false;
        if (isViewDownload) {
            document.getElementById('download').style.display = 'block';
        }
    } else if (name === 'share') {
        isViewSearch = false;
        isViewDownload = false;
        isViewShare = ! isViewShare;
        if (isViewShare) {
            document.getElementById('share').style.display = 'block';
        }
    }
}
