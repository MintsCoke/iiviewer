function decodePageNumber(number) {
    if (number == 'i') {
        return 1;
    } else if (number == 'ii') {
        return 2;
    } else {
        return parseInt(number) + 2;
    }
}

function encodePageNumber(number) {
    if (number == 1) {
        return 'i';
    } else if (number == 2) {
        return 'ii';
    } else {
        return parseInt(number) - 2;
    }
}

function encodePageTotal(number) {
    return number - 2;
}
