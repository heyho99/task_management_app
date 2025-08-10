// 共通ヘッダーを読み込む関数
async function loadHeader(activePage = '') {
    try {
        const response = await fetch('components/header.html');
        const headerHtml = await response.text();
        
        // ヘッダーを挿入
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = headerHtml;
            
            // アクティブなページのナビゲーションリンクにactiveクラスを追加
            if (activePage) {
                const activeLink = document.querySelector(`[data-page="${activePage}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }
    } catch (error) {
        console.error('ヘッダーの読み込みに失敗しました:', error);
    }
}

// 共通フッターを読み込む関数
async function loadFooter() {
    try {
        const response = await fetch('components/footer.html');
        const footerHtml = await response.text();
        
        // フッターを挿入
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = footerHtml;
        }
    } catch (error) {
        console.error('フッターの読み込みに失敗しました:', error);
    }
}

// ページロード時に共通コンポーネントを読み込み
document.addEventListener('DOMContentLoaded', function() {
    // data-page属性からアクティブページを取得
    const activePage = document.body.getAttribute('data-page');
    loadHeader(activePage);
    loadFooter();
});
