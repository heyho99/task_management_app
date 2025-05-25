/**
 * アプリケーションのメイン処理
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初期化
    init();
    
    // イベントリスナー設定
    setupEventListeners();
});


/**
 * アプリケーションの初期化
 */
async function init() {
    try {
        // 認証状態をチェック
        const isLoggedIn = await Auth.initialize();
        
        if (isLoggedIn) {
            // ログイン済みならメイン画面を表示
            showMainApp();
            showPage('top-page');
        } else {
            // 未ログインならログイン画面を表示
            showLoginScreen();
        }
    } catch (error) {
        console.error('初期化エラー:', error);
        showLoginScreen();
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // ログインフォーム
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);
    
    // ログアウトボタン
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', handleLogout);
    
    // ナビゲーションリンク
    const navLinks = document.querySelectorAll('#sidebar nav a[data-screen]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetScreen = e.target.getAttribute('data-screen');
            showPage(targetScreen);
        });
    });
    
    // モーダル閉じるボタン
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
    });
    
    // ボタンのイベントリスナー
    document.getElementById('create-task-btn').addEventListener('click', () => {
        Tasks.showTaskEditForm();
    });
    
    document.getElementById('add-work-btn').addEventListener('click', () => {
        Work.showWorkEditForm();
    });
    
    document.getElementById('add-time-btn').addEventListener('click', () => {
        Time.showWorkTimeEditForm();
    });
}

/**
 * ログイン処理
 * @param {Event} e - イベントオブジェクト
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        await Auth.login(username, password);
        showMainApp();
        showPage('top-page');
    } catch (error) {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。ユーザー名とパスワードを確認してください。');
    }
}

/**
 * ログアウト処理
 */
function handleLogout() {
    Auth.logout();
    showLoginScreen();
}

/**
 * ログイン画面を表示
 */
function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

/**
 * メインアプリ画面を表示
 */
function showMainApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    // 各ページのデータを読み込み
    loadPageData();
}

/**
 * 特定のページを表示
 * @param {string} pageId - ページのID
 */
function showPage(pageId) {
    // 全ページを非表示
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // 指定したページを表示
    document.getElementById(pageId).classList.remove('hidden');
    
    // 必要に応じてデータを再読み込み
    loadPageData(pageId);
}

/**
 * ページデータの読み込み
 * @param {string} pageId - ページのID（指定しない場合は全ページ）
 */
function loadPageData(pageId = null) {
    // トップページのデータ読み込み
    if (!pageId || pageId === 'top-page') {
        loadTopPageData();
    }
    
    // タスクページのデータ読み込み
    if (!pageId || pageId === 'task-page') {
        Tasks.renderTaskList(document.getElementById('task-list'));
    }
    
    // 時間ページのデータ読み込み
    if (!pageId || pageId === 'time-page') {
        Time.renderTaskTimeList(document.getElementById('time-list'));
    }
    
    // 実績入力ページのデータ読み込み
    if (!pageId || pageId === 'work-page') {
        Work.renderWorkList(document.getElementById('work-list'));
        Time.renderWorkTimeList(document.getElementById('time-record-list'));
    }
}

/**
 * トップページのデータ読み込み
 */
async function loadTopPageData() {
    try {
        // ダミーデータでチャートを描画（APIから取得する場合は置き換え）
        renderTaskProgressChart();
        renderTimeProgressChart();
        renderScheduleChart();
    } catch (error) {
        console.error('トップページデータ読み込みエラー:', error);
    }
}

/**
 * タスク進捗率チャートの描画
 */
function renderTaskProgressChart() {
    const chartElem = document.getElementById('task-progress-chart');
    
    // ダミーデータ
    chartElem.innerHTML = `
        <div class="dummy-chart">
            <div class="progress-circle" style="--progress: 65%;">
                <span class="progress-text">65%</span>
            </div>
            <p class="chart-note">タスク完了率</p>
        </div>
    `;
}

/**
 * タスク時間進捗率チャートの描画
 */
function renderTimeProgressChart() {
    const chartElem = document.getElementById('time-progress-chart');
    
    // ダミーデータ
    chartElem.innerHTML = `
        <div class="dummy-chart">
            <div class="progress-circle" style="--progress: 42%;">
                <span class="progress-text">42%</span>
            </div>
            <p class="chart-note">時間進捗率</p>
        </div>
    `;
}

/**
 * スケジュールチャートの描画
 */
function renderScheduleChart() {
    const chartElem = document.getElementById('schedule-chart');
    
    // ダミーデータ
    chartElem.innerHTML = `
        <div class="dummy-chart">
            <div class="schedule-bars">
                <div class="task-bar" style="width: 80%; margin-left: 10%;">タスクA</div>
                <div class="task-bar" style="width: 60%; margin-left: 20%;">タスクB</div>
                <div class="task-bar" style="width: 40%; margin-left: 30%;">タスクC</div>
            </div>
            <div class="time-scale">
                <span>4月</span>
                <span>5月</span>
                <span>6月</span>
            </div>
        </div>
    `;
} 