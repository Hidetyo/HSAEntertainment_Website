// script.js

/**
 * ページの初期化処理。
 * localStorageの言語設定に基づき、適切な言語ページにリダイレクトすることがある。
 * FOUC対策で非表示にされたbodyを表示する。
 * openTab関数を呼び出す（もし存在し、関連要素がページにあれば）。
 */
function initializePage() {
    const supportedLangs = ['ja', 'en'];
    let preferredLang = localStorage.getItem("lang");
    const currentPath = window.location.pathname;
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    let detectedLangInFile = null;
    if (currentFile.includes('_ja.html')) {
        detectedLangInFile = 'ja';
    } else if (currentFile.includes('_en.html')) {
        detectedLangInFile = 'en';
    }

    // localStorageに言語設定がない場合、ブラウザ言語から推定し保存
    if (!preferredLang) {
        const browserLang = (window.navigator.languages && window.navigator.languages[0]) || window.navigator.language || window.navigator.userLanguage;
        const primaryBrowserLang = browserLang.substring(0, 2).toLowerCase();
        if (supportedLangs.includes(primaryBrowserLang)) {
            preferredLang = primaryBrowserLang;
        } else {
            preferredLang = 'ja'; // デフォルト言語
        }
        localStorage.setItem("lang", preferredLang);
    }

    // 表示中のページの言語と優先言語が異なり、かつリダイレクトループを避けるためにファイル名が明確な場合のみリダイレクト
    if (detectedLangInFile && detectedLangInFile !== preferredLang && supportedLangs.includes(preferredLang)) {
        // console.log(`Redirecting: File lang '${detectedLangInFile}' differs from preferred lang '${preferredLang}'. Current file: ${currentFile}`);
        redirectToLangVersion(preferredLang, currentFile);
        return; // リダイレクトするので以降の処理は中断
    }

    // body の visibility を 'visible' にする (style.css で hidden に設定されているため)
    document.body.style.visibility = "visible";

    // openTab関数呼び出し (元のscript.jsにあったもの)
    // この関数が対象とする .research や .hobby クラスがページ内に存在する場合に機能します。
    if (typeof openTab === 'function') {
        openTab('all');
    }
}

/**
 * 指定された言語バージョンの適切なHTMLファイルにリダイレクトする。
 * @param {string} lang - 'ja' または 'en'
 * @param {string} currentFilename - 現在のページのファイル名 (例: 'index_ja.html')
 */
function redirectToLangVersion(lang, currentFilename) {
    localStorage.setItem("lang", lang); // 念のためここでも設定

    let baseName = "";
    const jaSuffix = '_ja.html';
    const enSuffix = '_en.html';

    if (currentFilename.endsWith(jaSuffix)) {
        baseName = currentFilename.substring(0, currentFilename.length - jaSuffix.length);
    } else if (currentFilename.endsWith(enSuffix)) {
        baseName = currentFilename.substring(0, currentFilename.length - enSuffix.length);
    } else if (currentFilename.endsWith('.html')) { // サフィックスなしの .html ファイルの場合
        baseName = currentFilename.substring(0, currentFilename.length - '.html'.length);
    } else if (currentFilename === "") { // ルートパスの場合 (index.htmlからのリダイレクト後など)
         baseName = "index";
    }
     else { // 拡張子がない場合などはそのままベース名として扱う（一般的ではないが）
        baseName = currentFilename;
    }
    if (baseName === "") baseName = "index"; // フォールバック

    const newPage = `${baseName}_${lang}.html`;
    
    let currentPath = window.location.pathname;
    let newPath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1) + newPage;
    
    let queryString = window.location.search;
    let hashString = window.location.hash;

    // 無限ループを避けるため、実際に遷移が必要な場合のみ実行
    if (currentPath.substring(currentPath.lastIndexOf('/') + 1) !== newPage || 
        window.location.search !== queryString || 
        window.location.hash !== hashString) {
        window.location.href = newPath + queryString + hashString;
    }
}

/**
 * 言語切り替えボタンから呼び出される関数。
 * localStorageに選択言語を保存し、対応する言語ページに遷移する。
 * @param {string} lang - 切り替え先の言語 ('ja' または 'en')
 */
function switchLang(lang) {
    const currentFile = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
    redirectToLangVersion(lang, currentFile);
}

/**
 * openTab関数 (元のscript.jsからそのまま流用)
 * .research, .hobbyクラスを持つ要素の表示を制御する。
 * @param {string} tabName - 表示するタブ名 ('all', 'research', 'hobby')
 */
function openTab(tabName) {
  const elements = document.querySelectorAll('.research, .hobby');
  for (let i = 0; i < elements.length; i++) {
    elements[i].style.display = 'none';
  }
  if (tabName === 'all') { // 元のコードでは tabName == 'all'
    const dispelements = document.querySelectorAll('.research, .hobby');
    // 元のコードでは elements.length を使っていたが、dispelements.length が適切か、あるいは elements.length で良いか確認が必要
    // ここでは元のコードに合わせて elements.length を使う
    for (let i = 0; i < elements.length; i++) { //
      if (dispelements[i]) { // dispelements[i] が存在するか確認
          dispelements[i].style.display = 'inline';
      }
    }
  }
  else {
    const dispelements = document.querySelectorAll(`.${tabName}`);
    for (let i = 0; i < elements.length; i++) { // こちらも同様の注意点
        if (dispelements[i]) {
            dispelements[i].style.display = 'inline';
        }
    }
  }
}

// DOMContentLoadedではなく、元のwindow.onloadに合わせて初期化処理を実行
// ただし、jQueryのload処理などとの兼ね合いがある場合はDOMContentLoadedの方が良い場合もある
window.onload = function () {
  initializePage();
};