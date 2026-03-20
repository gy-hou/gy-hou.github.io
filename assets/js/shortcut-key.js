// Check if the user is on a Mac and update the shortcut key for search accordingly
document.addEventListener("readystatechange", () => {
  if (document.readyState === "interactive") {
    let isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    let shortcutKeyElement = document.querySelector("#search-toggle .nav-link");
    if (shortcutKeyElement && isMac) {
      // 只显示搜索图标，不显示快捷键文字
      shortcutKeyElement.innerHTML = '<i class="ti ti-search"></i>';
    }
  }
});
