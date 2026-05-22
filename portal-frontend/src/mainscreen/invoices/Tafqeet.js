/**
 * هذا الكود منشور تحت رخضة المشاع الإبداعي الإصدار 3.0
 * ويمكنك نشر، أو نسخ، أو إعادة توزيع الكود حتى للأغراض التجارية
 * Author: ASammour
 * E-mail: amsammour[at]gmail[dot]com
 */

var ones = {
  0: "صفر",
  1: "واحد",
  2: "اثنان",
  3: "ثلاثة",
  4: "أربعة",
  5: "خمسة",
  6: "ستة",
  7: "سبعة",
  8: "ثمانية",
  9: "تسعة",
  10: "عشرة",
  11: "أحد عشر",
  12: "اثنى عشر",
};

var tens = {
  1: "عشر",
  2: "عشرون",
  3: "ثلاثون",
  4: "أربعون",
  5: "خمسون",
  6: "ستون",
  7: "سبعون",
  8: "ثمانون",
  9: "تسعون",
};

var hundreds = {
  0: "صفر",
  1: "مائة",
  2: "مئتان",
  3: "ثلاثمائة",
  4: "أربعمائة",
  5: "خمسمائة",
  6: "ستمائة",
  7: "سبعمائة",
  8: "ثمانمائة",
  9: "تسعمائة",
};

var thousands = {
  1: "ألف",
  2: "ألفان",
  39: "آلاف",
  1199: "ألفًا",
};

var millions = {
  1: "مليون",
  2: "مليونان",
  39: "ملايين",
  1199: "مليونًا",
};

var billions = {
  1: "مليار",
  2: "ملياران",
  39: "مليارات",
  1199: "مليارًا",
};

var trillions = {
  1: "تريليون",
  2: "تريليونان",
  39: "تريليونات",
  1199: "تريليونًا",
};

function tafqeet(number) {
  var value = "";
  number = parseInt(number);

  if (
    number.toString().match(/^[0-9]+$/) != null &&
    number.toString().length <= 14
  ) {
    switch (number.toString().length) {
      case 1:
      case 2:
        value = oneTen(number);
        break;
      case 3:
        value = hundred(number);
        break;
      case 4:
      case 5:
      case 6:
        value = thousand(number);
        break;
      case 7:
      case 8:
      case 9:
        value = million(number);
        break;
      case 10:
      case 11:
      case 12:
        value = billion(number);
        break;
      case 13:
      case 14:
      case 15:
        value = trillion(number);
        break;
      default:
        break;
    }
  }

  return value
    .replace(/وصفر/g, "")
    .replace(/وundefined/g, "")
    .replace(/ +(?= )/g, "")
    .replace(/صفر و/g, "")
    .replace(/صفر/g, "")
    .replace(/مئتان أ/, "مائتا أ")
    .replace(/مئتان م/, "مائتا م");
}

function oneTen(number) {
  var value = "صفر";

  if (number <= 12) {
    switch (parseInt(number)) {
      case 0:
        value = ones["0"];
        break;
      case 1:
        value = ones["1"];
        break;
      case 2:
        value = ones["2"];
        break;
      case 3:
        value = ones["3"];
        break;
      case 4:
        value = ones["4"];
        break;
      case 5:
        value = ones["5"];
        break;
      case 6:
        value = ones["6"];
        break;
      case 7:
        value = ones["7"];
        break;
      case 8:
        value = ones["8"];
        break;
      case 9:
        value = ones["9"];
        break;
      case 10:
        value = ones["10"];
        break;
      case 11:
        value = ones["11"];
        break;
      case 12:
        value = ones["12"];
        break;
      default:
        break;
    }
  } else {
    switch (number.toString().length) {
      case 2:
        if (number.toString()[1] === "0") {
          value = tens[number.toString()[0]];
        } else {
          var lessTen = parseInt(number.toString()[1]);
          var firstTen = parseInt(number.toString()[0]);
          if (lessTen === 1 && firstTen === 1) {
            value = "أحد عشر";
          } else if (lessTen === 2 && firstTen === 1) {
            value = "اثنا عشر";
          } else {
            value = `${ones[lessTen]} و ${tens[firstTen]}`;
          }
        }
        break;
      default:
        break;
    }
  }

  return value;
}

function hundred(number) {
  var value = "";
  var first = parseInt(number.toString()[0]);
  var lastTwo = parseInt(number.toString().substring(1));

  if (lastTwo === 0) {
    value = hundreds[first];
  } else {
    value = `${hundreds[first]} و ${oneTen(lastTwo)}`;
  }

  return value;
}

function thousand(number) {
  var value = "";
  var str = number.toString();
  var firstPart = parseInt(str.slice(0, str.length - 3));
  var secondPart = parseInt(str.slice(-3));

  value = getScaleValue(firstPart, thousands);
  if (secondPart > 0) {
    value += ` و ${secondPart < 100 ? oneTen(secondPart) : hundred(secondPart)}`;
  }

  return value;
}

function million(number) {
  var value = "";
  var str = number.toString();
  var firstPart = parseInt(str.slice(0, str.length - 6));
  var secondPart = parseInt(str.slice(-6));

  value = getScaleValue(firstPart, millions);
  if (secondPart > 0) {
    if (secondPart < 1000) {
      value += ` و ${secondPart < 100 ? oneTen(secondPart) : hundred(secondPart)}`;
    } else {
      value += ` و ${thousand(secondPart)}`;
    }
  }

  return value;
}

function billion(number) {
  var value = "";
  var str = number.toString();
  var firstPart = parseInt(str.slice(0, str.length - 9));
  var secondPart = parseInt(str.slice(-9));

  value = getScaleValue(firstPart, billions);
  if (secondPart > 0) {
    if (secondPart < 1000000) {
      value += ` و ${secondPart < 1000 ? oneTen(secondPart) : thousand(secondPart)}`;
    } else {
      value += ` و ${million(secondPart)}`;
    }
  }

  return value;
}

function trillion(number) {
  var value = "";
  var str = number.toString();
  var firstPart = parseInt(str.slice(0, str.length - 12));
  var secondPart = parseInt(str.slice(-12));

  value = getScaleValue(firstPart, trillions);
  if (secondPart > 0) {
    if (secondPart < 1000000000) {
      value += ` و ${secondPart < 1000000 ? thousand(secondPart) : million(secondPart)}`;
    } else {
      value += ` و ${billion(secondPart)}`;
    }
  }

  return value;
}

function getScaleValue(number, scaleMap) {
  if (number === 1) return scaleMap[1];
  if (number === 2) return scaleMap[2];
  if (number >= 3 && number <= 10) return `${oneTen(number)} ${scaleMap[39]}`;
  if (number >= 11 && number <= 99) return `${oneTen(number)} ${scaleMap[1199]}`;
  if (number >= 100 && number <= 999) return `${hundred(number)} ${scaleMap[1199]}`;
  if (number >= 1000 && number <= 999999) return `${thousand(number)} ${scaleMap[1199]}`;
  if (number >= 1000000 && number <= 999999999) return `${million(number)} ${scaleMap[1199]}`;
  return "";
}

export { tafqeet };
