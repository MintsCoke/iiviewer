function onPrevPage() {
    if (pageNum <= 1) {
        return;
    }
    if (isViewDouble) {
        pageNum -= 2;
    } else {
        pageNum--;
    }
    queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    if (isViewDouble) {
        pageNum += 2;
    } else {
        pageNum++;
    }
    queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);

function onFirstPage() {
    if (pageNum == 1) {
        return;
    }
    pageNum = 1;
    queueRenderPage(pageNum);
}
document.getElementById('first').addEventListener('click', onFirstPage);

function onLastPage() {
    if (pageNum == pdfDoc.numPages) {
        return;
    }
    pageNum = pdfDoc.numPages;
    queueRenderPage(pageNum);
}
document.getElementById('last').addEventListener('click', onLastPage);

function onChangePage() {
    var changePageNum = parseInt(decodePageNumber(document.getElementById('page_num').value));
    if (changePageNum <= 1) {
        return onFirstPage();
    } else if (changePageNum >= pdfDoc.numPages) {
        return onLastPage();
    }
    pageNum = changePageNum;
    queueRenderPage(pageNum);
}
document.getElementById('page_num').addEventListener('change', onChangePage);

function onViewPage(event) {
    var clickedPage = parseInt(this.dataset.pageNumber);
    if (pageNum == clickedPage) {
        return;
    }
    pageNum = clickedPage;
    queueRenderPage(pageNum);
}
