/**
 * タスク管理関連の機能を提供するモジュール
 */


/**
全体の構成

Tasksオブジェクトの定義
calculateInitialValues(formData):初期値計算関数
initTaskCreationPage():タスク作成ページの初期化関数
initTaskEditPage():タスク編集ページの初期化関数
loadTaskForEdit(taskId):タスク編集ページの読み込み関数
addSubtaskField(subtaskData):サブタスク追加関数
redistributeSubtaskContributions():サブタスクの貢献度再分配関数
removeSubtask(button):サブタスク削除関数
updateInitialValues():初期値更新関数
ページ初期化処理の追加
グローバルに公開する
*/


// Tasksオブジェクトは削除されました。
// 現在はapi.jsのApiClientを使用してタスク操作を行います。



/**
 * 初期値計算処理
 * @param {Object} formData - 入力データ
 * @returns {Promise} - 計算結果Promise
 */
async function calculateInitialValues(formData) {
    try {
        const result = await ApiClient.task.calculateInitialValues({
            start_date: formData.start_date,
            due_date: formData.due_date,
            target_time: parseInt(formData.target_time),
            subtask_count: formData.subtasks.length || 1
        });
        return result;
    } catch (error) {
        ApiClient.displayError(error);
        throw error;
    }
}



/**
 * タスク作成ページの初期化
 */
function initTaskCreationPage() {
    console.log('initTaskCreationPage関数が呼び出されました');
    const form = document.getElementById('task-create-form');
    const addSubtaskBtn = document.getElementById('add-subtask');
    const subtaskContainer = document.getElementById('subtasks-container');
    const startDateInput = document.getElementById('start-date');
    const dueDateInput = document.getElementById('due-date');
    const targetTimeInput = document.getElementById('target-time');

    console.log('addSubtaskBtn要素:', addSubtaskBtn);

    // サブタスク追加ボタンのイベントリスナー
    if (addSubtaskBtn) {
        console.log('サブタスク追加ボタンにイベントリスナーを追加します');
        // インラインのonclick属性を使用する代わりに、ここでイベントリスナーを追加
        addSubtaskBtn.onclick = function() {
            console.log('サブタスク追加ボタンがクリックされました');
            window.addSubtaskField(); // グローバル関数として呼び出し
        };
    }

    // 日付またはターゲット時間が変更されたら初期値を再計算
    if (startDateInput && dueDateInput && targetTimeInput) {
        [startDateInput, dueDateInput, targetTimeInput].forEach(input => {
            input.addEventListener('change', updateInitialValues);
        });
    }

    // 初期サブタスク追加
    addSubtaskField();

    // フォーム送信イベントリスナー
    if (form) {
        form.addEventListener('submit', handleTaskSubmit);
    }
}



/**
 * タスク編集ページの初期化
 */
function initTaskEditPage() {
    console.log('initTaskEditPage関数が呼び出されました');
    const form = document.getElementById('task-edit-form');
    const addSubtaskBtn = document.getElementById('add-subtask');
    const subtaskContainer = document.getElementById('subtasks-container');
    const startDateInput = document.getElementById('start-date');
    const dueDateInput = document.getElementById('due-date');
    const targetTimeInput = document.getElementById('target-time');

    console.log('addSubtaskBtn要素:', addSubtaskBtn);

    // URLパラメータからタスクIDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');
    
    if (!taskId) {
        alert('タスクIDが指定されていません。タスク一覧に戻ります。');
        window.location.href = 'tasks.html';
        return;
    }

    // タスク情報を読み込んで表示
    loadTaskForEdit(taskId);

    // サブタスク追加ボタンのイベントリスナー
    if (addSubtaskBtn) {
        console.log('サブタスク追加ボタンにイベントリスナーを追加します');
        addSubtaskBtn.onclick = function() {
            console.log('サブタスク追加ボタンがクリックされました');
            window.addSubtaskField(); // グローバル関数として呼び出し
        };
    }

    // 日付またはターゲット時間が変更されたら初期値を再計算
    if (startDateInput && dueDateInput && targetTimeInput) {
        [startDateInput, dueDateInput, targetTimeInput].forEach(input => {
            input.addEventListener('change', updateInitialValues);
        });
    }

    // フォーム送信イベントリスナー
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // バリデーション
            const isTaskPlansValid = validateDailyTaskPlans();
            const isTimePlansValid = validateDailyTimePlans();
            const isSubtasksValid = validateSubtaskContributions();
            
            if (!isTaskPlansValid || !isTimePlansValid || !isSubtasksValid) {
                return;
            }
            
            try {
                // エラーメッセージを事前に非表示
                const errorElement = document.getElementById('error-message');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                
                // 現在存在するサブタスクIDを取得
                console.log('タスクID:', taskId);
                const existingSubtasks = await ApiClient.task.getSubtasks(taskId);
                console.log('既存のサブタスク:', existingSubtasks);
                const existingSubtaskIds = existingSubtasks.map(s => s.subtask_id.toString());
                console.log('既存のサブタスクID:', existingSubtaskIds);
                
                // サブタスク情報を収集
                const currentSubtasks = collectSubtasks();
                console.log('現在のサブタスク:', currentSubtasks);
                
                // フォームデータの収集（サブタスクを除く）
                const formData = {
                    task_name: document.getElementById('task-name').value,
                    task_content: document.getElementById('task-content').value,
                    recent_schedule: document.getElementById('recent-schedule').value,
                    start_date: document.getElementById('start-date').value,
                    due_date: document.getElementById('due-date').value,
                    category: document.getElementById('category').value,
                    target_time: parseInt(document.getElementById('target-time').value),
                    comment: document.getElementById('comment').value || '',
                    
                    // 日次作業計画値
                    daily_task_plans: collectDailyTaskPlans(),
                    
                    // 日次作業時間計画値
                    daily_time_plans: collectDailyTimePlans()
                };
                
                console.log('更新するタスクデータ:', formData);
                
                try {
                    // 1. まずタスク本体を更新
                    console.log('タスク本体更新開始...');
                    const updatedTask = await ApiClient.task.updateTask(taskId, formData);
                    console.log('タスク本体更新完了:', updatedTask);
                } catch (taskUpdateError) {
                    console.error('タスク本体更新に失敗:', taskUpdateError);
                    throw new Error(`タスク本体の更新に失敗しました: ${taskUpdateError.message}`);
                }
                
                // 2. サブタスクの作成・更新・削除を処理
                const subtaskPromises = [];
                const subtaskErrors = [];
                
                // 新規または更新するサブタスク
                console.log('サブタスク処理開始...');
                
                for (const subtask of currentSubtasks) {
                    if (subtask.subtask_id) {
                        // 更新
                        console.log(`サブタスク更新: ID=${subtask.subtask_id}`, subtask);
                        subtaskPromises.push(
                            ApiClient.task.updateSubtask(subtask.subtask_id, {
                                subtask_name: subtask.subtask_name,
                                contribution_value: subtask.contribution_value
                            }).catch(err => {
                                console.error(`サブタスク更新エラー: ID=${subtask.subtask_id}`, err);
                                subtaskErrors.push(`サブタスク「${subtask.subtask_name}」の更新に失敗: ${err.message}`);
                                return null;
                            })
                        );
                    } else {
                        // 新規作成
                        console.log(`サブタスク作成: タスクID=${taskId}`, subtask);
                        
                        // APIに送信するデータを整形
                        const newSubtaskData = {
                            subtask_name: subtask.subtask_name,
                            contribution_value: subtask.contribution_value
                        };
                        console.log('新規サブタスク送信データ:', newSubtaskData);
                        
                        // 貢献値のバリデーション（小数点表示を修正）
                        if (newSubtaskData.contribution_value % 1 !== 0) {
                            newSubtaskData.contribution_value = parseFloat(newSubtaskData.contribution_value.toFixed(2));
                        }
                        
                        subtaskPromises.push(
                            ApiClient.task.createSubtask(taskId, newSubtaskData)
                                .then(response => {
                                    console.log('サブタスク作成成功:', response);
                                    return response;
                                })
                                .catch(err => {
                                    console.error(`サブタスク作成エラー: ${subtask.subtask_name}`, err);
                                    subtaskErrors.push(`サブタスク「${subtask.subtask_name}」の作成に失敗: ${err.message}`);
                                    return null;
                                })
                        );
                    }
                }
                
                // 削除対象のサブタスクを特定
                const currentSubtaskIds = currentSubtasks
                    .filter(s => s.subtask_id)
                    .map(s => s.subtask_id.toString());
                const subtasksToDelete = existingSubtaskIds.filter(
                    id => !currentSubtaskIds.includes(id)
                );
                
                // 削除処理
                for (const subtaskId of subtasksToDelete) {
                    console.log(`サブタスク削除: ID=${subtaskId}`);
                    subtaskPromises.push(
                        ApiClient.task.deleteSubtask(subtaskId).catch(err => {
                            console.error(`サブタスク削除エラー: ID=${subtaskId}`, err);
                            subtaskErrors.push(`サブタスクID ${subtaskId} の削除に失敗: ${err.message}`);
                            return null;
                        })
                    );
                }
                
                // すべてのサブタスク処理を待機
                console.log('すべてのサブタスク処理を待機中...');
                const subtaskResults = await Promise.all(subtaskPromises);
                console.log('サブタスク処理完了:', subtaskResults);
                
                // エラーがある場合は警告を表示
                if (subtaskErrors.length > 0) {
                    console.warn('一部のサブタスク処理に失敗しました:', subtaskErrors);
                    alert(`タスクは更新されましたが、一部のサブタスク処理に失敗しました:\n${subtaskErrors.join('\n')}`);
                } else {
                    alert('タスクが正常に更新されました');
                }
                
                // タスク一覧ページにリダイレクト
                window.location.href = 'tasks.html';
            } catch (error) {
                console.error('タスク更新エラー詳細:', error);
                
                // エラーメッセージに詳細情報を追加
                let errorMsg = `タスク更新エラー: ${error.message}`;
                if (error.stack) {
                    console.error('スタックトレース:', error.stack);
                }
                
                // APIクライアントのエラー表示関数を使用
                ApiClient.displayError({
                    message: errorMsg,
                    originalError: error
                });
            }
        });
    }
}



/**
 * 編集用にタスク情報を読み込んで表示する
 * @param {string} taskId - 編集対象のタスクID
 */
async function loadTaskForEdit(taskId) {
    try {
        const task = await ApiClient.task.getTask(taskId);
        console.log('編集するタスク:', task);
        
        // hiddenフィールドにタスクIDをセット
        if (document.getElementById('task-id')) {
            document.getElementById('task-id').value = taskId;
        }
        
        // フォームに値を設定
        document.getElementById('task-name').value = task.task_name;
        document.getElementById('task-content').value = task.task_content || '';
        document.getElementById('recent-schedule').value = task.recent_schedule || '';
        document.getElementById('start-date').value = new Date(task.start_date).toISOString().split('T')[0];
        document.getElementById('due-date').value = new Date(task.due_date).toISOString().split('T')[0];
        document.getElementById('category').value = task.category;
        document.getElementById('target-time').value = task.target_time;
        document.getElementById('comment').value = task.comment || '';
        
        // サブタスクの読み込みと表示
        const subtasks = await ApiClient.task.getSubtasks(taskId);
        console.log('取得したサブタスク:', subtasks);
        
        const subtasksContainer = document.getElementById('subtasks-container');
        subtasksContainer.innerHTML = ''; // 既存のサブタスクをクリア
        
        if (subtasks && subtasks.length > 0) {
            // サブタスクを順番に追加
            for (const subtask of subtasks) {
                addSubtaskField({
                    subtask_id: subtask.subtask_id,
                    subtask_name: subtask.subtask_name,
                    contribution_value: subtask.contribution_value
                });
            }
        } else {
            // サブタスクがない場合は初期フィールドを追加
            addSubtaskField();
        }
        
        // 日次プランの取得と表示
        await updateInitialValues();
        
    } catch (error) {
        console.error('タスク読み込みエラー:', error);
        alert('タスクの読み込みに失敗しました。タスク一覧に戻ります。');
        window.location.href = 'tasks.html';
    }
}



/**
 * サブタスクフィールドを追加
 * @param {Object} subtaskData - 既存のサブタスクデータ（オプション）
 */
function addSubtaskField(subtaskData = null) {
    console.log('addSubtaskField関数が呼び出されました', subtaskData);
    const container = document.getElementById('subtasks-container');
    console.log('subtasks-container要素:', container);
    const index = container.children.length;
    console.log('現在のサブタスク数:', index);
    
    // 編集モードの場合は、既存の値を使用
    if (subtaskData && subtaskData.subtask_id) {
        const contributionValue = subtaskData.contribution_value;
        console.log('既存のサブタスクデータを使用:', subtaskData);
        
        const subtaskHtml = `
            <div class="row g-3 subtask-row mb-3" data-index="${index}">
                <div class="col-md-6">
                    <label for="subtask-name-${index}" class="form-label">サブタスク名</label>
                    <input type="text" class="form-control subtask-name" id="subtask-name-${index}" 
                           value="${subtaskData.subtask_name || ''}" required>
                </div>
                <div class="col-md-4">
                    <label for="subtask-contrib-${index}" class="form-label">作業貢献値（%）</label>
                    <input type="number" class="form-control subtask-contrib" id="subtask-contrib-${index}" 
                           min="1" max="100" value="${contributionValue.toFixed(2)}" 
                           data-subtask-id="${subtaskData.subtask_id}"
                           step="0.01" onchange="window.redistributeContributionValues(this)" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger w-100" onclick="window.removeSubtask(this)">削除</button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subtaskHtml);
        console.log('サブタスクHTMLを追加しました:', subtaskData.subtask_id);
        validateSubtaskContributions();
    } else {
        // 新規追加の場合は、まず要素を追加
        const subtaskName = subtaskData && subtaskData.subtask_name ? subtaskData.subtask_name : '';
        
        const subtaskHtml = `
            <div class="row g-3 subtask-row mb-3" data-index="${index}">
                <div class="col-md-6">
                    <label for="subtask-name-${index}" class="form-label">サブタスク名</label>
                    <input type="text" class="form-control subtask-name" id="subtask-name-${index}" 
                           value="${subtaskName}" required>
                </div>
                <div class="col-md-4">
                    <label for="subtask-contrib-${index}" class="form-label">作業貢献値（%）</label>
                    <input type="number" class="form-control subtask-contrib" id="subtask-contrib-${index}" 
                           min="1" max="100" value="0" 
                           data-subtask-id="null"
                           step="0.01" onchange="window.redistributeContributionValues(this)" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger w-100" onclick="window.removeSubtask(this)">削除</button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subtaskHtml);
        console.log('新規サブタスクHTMLを追加しました');
        
        // すべてのサブタスクに均等に貢献値を再配分
        const totalCount = container.getElementsByClassName('subtask-row').length;
        const equalContribution = (100 / totalCount).toFixed(2);
        console.log(`新規サブタスク追加後の均等分配値: ${equalContribution}% (${totalCount}個のサブタスク)`);
        
        // 貢献値を設定
        Array.from(container.getElementsByClassName('subtask-row')).forEach(subtask => {
            const input = subtask.querySelector('.subtask-contrib');
            input.value = equalContribution;
        });
        
        validateSubtaskContributions();
    }
}



/**
 * サブタスクの貢献値を均等に再配分
 */
function redistributeSubtaskContributions() {
    console.log('貢献値を均等に再配分します');
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-row');
    const count = subtasks.length;
    
    if (count === 0) return;
    
    // 均等な貢献値を計算
    const equalContribution = (100 / count).toFixed(2);
    console.log(`均等分配値: ${equalContribution}% (${count}個のサブタスク)`);
    
    // すべてのサブタスクに均等な値を設定
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
        input.value = equalContribution;
    });
    
    validateSubtaskContributions();
}



/**
 * サブタスクを削除
 * @param {HTMLElement} button - 削除ボタン要素
 */
function removeSubtask(button) {
    const row = button.closest('.subtask-row');
    
    // 削除確認
    const confirmation = confirm('このサブタスクを削除してもよろしいですか？');
    if (!confirmation) return;
    
    // UIから削除（API削除はフォーム送信時に行う）
    row.remove();
    
    // 削除後に残ったサブタスクの作業貢献値を再調整
    redistributeSubtaskContributions();
}



/**
 * 初期値の更新
 */
async function updateInitialValues() {
    const startDate = document.getElementById('start-date').value;
    const dueDate = document.getElementById('due-date').value;
    const targetTime = document.getElementById('target-time').value;
    const subtasksCount = document.getElementById('subtasks-container').getElementsByClassName('subtask-row').length || 1;
    
    if (!startDate || !dueDate || !targetTime) return;
    
    try {
        const data = await calculateInitialValues({
            start_date: startDate,
            due_date: dueDate,
            target_time: parseInt(targetTime),
            subtasks: Array(subtasksCount).fill({}) // ダミーのサブタスク配列
        });
        
        // 計算結果を表示
        updateDailyTaskPlans(data.daily_task_plans);
        updateDailyTimePlans(data.daily_time_plans);
        
        // サブタスク貢献値の更新
        updateSubtaskContributions(data.subtask_contribution_value);
    } catch (error) {
        console.error('初期値計算エラー:', error);
    }
}



/**
 * 日次作業計画値の更新
 */
function updateDailyTaskPlans(dailyTaskPlans) {
    const container = document.getElementById('daily-task-plans-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    dailyTaskPlans.forEach(plan => {
        const date = new Date(plan.date);
        const formattedDate = date.toLocaleDateString('ja-JP');
        
        const planDiv = document.createElement('div');
        planDiv.className = 'daily-task-plan mb-2';
        planDiv.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <input type="date" class="form-control" value="${plan.date}" readonly>
                </div>
                <div class="col-md-6">
                    <input type="number" class="form-control daily-task-plan-value" 
                           value="${plan.task_plan_value.toFixed(2)}" step="0.01" min="0" max="100" required>
                </div>
            </div>
        `;
        
        container.appendChild(planDiv);
    });
    
    // 作業計画値変更時のイベント登録
    const planInputs = container.querySelectorAll('.daily-task-plan-value');
    planInputs.forEach(input => {
        input.addEventListener('change', validateDailyTaskPlans);
    });
}

/**
 * 日次作業時間計画値の更新
 */
function updateDailyTimePlans(dailyTimePlans) {
    const container = document.getElementById('daily-time-plans-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    dailyTimePlans.forEach(plan => {
        const date = new Date(plan.date);
        const formattedDate = date.toLocaleDateString('ja-JP');
        
        const planDiv = document.createElement('div');
        planDiv.className = 'daily-time-plan mb-2';
        planDiv.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <input type="date" class="form-control" value="${plan.date}" readonly>
                </div>
                <div class="col-md-6">
                    <input type="number" class="form-control daily-time-plan-value" 
                           value="${plan.time_plan_value.toFixed(2)}" step="0.01" min="0" required>
                </div>
            </div>
        `;
        
        container.appendChild(planDiv);
    });
    
    // 作業時間計画値変更時のイベント登録
    const planInputs = container.querySelectorAll('.daily-time-plan-value');
    planInputs.forEach(input => {
        input.addEventListener('change', validateDailyTimePlans);
    });
}



/**
 * サブタスク貢献値の更新
 */
function updateSubtaskContributions(contributionValue) {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-row');
    
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
        input.value = contributionValue.toFixed(2);
    });
}

/**
 * 日次作業計画値のバリデーション
 */
function validateDailyTaskPlans() {
    const container = document.getElementById('daily-task-plans-container');
    const planInputs = container.querySelectorAll('.daily-task-plan-value');
    const errorElement = document.getElementById('task-plan-error');
    
    let total = 0;
    planInputs.forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    // 100に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - 100) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `日次作業計画値の合計は100にしてください（現在: ${total.toFixed(2)}）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    return isValid;
}



/**
 * 日次作業時間計画値のバリデーション
 */
function validateDailyTimePlans() {
    const container = document.getElementById('daily-time-plans-container');
    const planInputs = container.querySelectorAll('.daily-time-plan-value');
    const targetTime = parseFloat(document.getElementById('target-time').value || 0);
    const errorElement = document.getElementById('time-plan-error');
    
    let total = 0;
    planInputs.forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    // 目標時間に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - targetTime) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `日次作業時間計画値の合計は目標作業時間（${targetTime}分）にしてください（現在: ${total.toFixed(2)}分）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    return isValid;
}



/**
 * サブタスク貢献値のバリデーション
 */
function validateSubtaskContributions() {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-row');
    const errorElement = document.getElementById('subtask-error');
    
    let total = 0;
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
        total += parseFloat(input.value || 0);
    });
    
    // 100に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - 100) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `サブタスクの作業貢献値の合計は100にしてください（現在: ${total.toFixed(2)}）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    // 合計が100でない場合、自動的に調整を試みる
    if (!isValid && subtasks.length > 0) {
        // 均等な貢献値を計算
        const equalContribution = (100 / subtasks.length).toFixed(2);
        console.log(`貢献値を自動調整します: ${equalContribution}% (${subtasks.length}個のサブタスク)`);
        
        // すべてのサブタスクに均等な値を設定
        Array.from(subtasks).forEach(subtask => {
            const input = subtask.querySelector('.subtask-contrib');
            input.value = equalContribution;
        });
        
        // エラー表示を更新
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        return true;
    }
    
    return isValid;
}



/**
 * フォーム送信処理
 * @param {Event} event - イベントオブジェクト
 */
async function handleTaskSubmit(event) {
    event.preventDefault();
    
    // バリデーション
    const isTaskPlansValid = validateDailyTaskPlans();
    const isTimePlansValid = validateDailyTimePlans();
    const isSubtasksValid = validateSubtaskContributions();
    
    if (!isTaskPlansValid || !isTimePlansValid || !isSubtasksValid) {
        return;
    }
    
    // フォームデータの収集
    const formData = {
        task_name: document.getElementById('task-name').value,
        task_content: document.getElementById('task-content').value,
        recent_schedule: document.getElementById('recent-schedule').value,
        start_date: document.getElementById('start-date').value,
        due_date: document.getElementById('due-date').value,
        category: document.getElementById('category').value,
        target_time: parseInt(document.getElementById('target-time').value),
        comment: document.getElementById('comment').value || '',
        
        // サブタスク情報
        subtasks: collectSubtasks(),
        
        // 日次作業計画値
        daily_task_plans: collectDailyTaskPlans(),
        
        // 日次作業時間計画値
        daily_time_plans: collectDailyTimePlans()
    };
    
    try {
        console.log('送信するタスクデータ:', formData);
        const createdTask = await ApiClient.task.createTask(formData);
        console.log('作成されたタスク:', createdTask);
        
        alert('タスクが正常に作成されました');
        
        // タスク一覧ページにリダイレクト
        window.location.href = 'tasks.html';
    } catch (error) {
        console.error('タスク作成エラー詳細:', error);
        ApiClient.displayError(error);
    }
}



/**
 * サブタスク情報の収集
 * @returns {Array} - サブタスク情報の配列
 */
function collectSubtasks() {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-row');
    
    // 現在表示されているサブタスクの情報を収集
    const result = Array.from(subtasks).map(subtask => {
        const subtaskInput = subtask.querySelector('.subtask-contrib');
        // サブタスクIDを適切に取得（空文字や未定義の場合はnullに設定）
        let subtaskId = subtaskInput.dataset.subtaskId;
        
        // 空文字、"undefined"、undefined をすべてnullとして扱う
        subtaskId = (subtaskId && subtaskId.trim() !== '' && subtaskId !== 'undefined' && subtaskId !== 'null') ? parseInt(subtaskId) : null;
        
        // 名前と貢献値
        const subtaskName = subtask.querySelector('.subtask-name').value.trim();
        let contributionValue = parseFloat(subtaskInput.value) || 0;
        
        // 小数点以下2桁に丸める
        contributionValue = parseFloat(contributionValue.toFixed(2));
        
        console.log(`サブタスク収集: ID=${subtaskId}, 名前=${subtaskName}, 貢献値=${contributionValue}, 型=${typeof subtaskId}`);
        
        return {
            subtask_id: subtaskId,
            subtask_name: subtaskName,
            contribution_value: contributionValue
        };
    });
    
    // 合計値確認
    const total = result.reduce((sum, item) => sum + item.contribution_value, 0);
    console.log(`サブタスク貢献値合計: ${total.toFixed(2)}%`);
    
    // 合計が100でない場合は調整
    if (Math.abs(total - 100) > 0.1 && result.length > 0) {
        console.log('貢献値合計が100%でないため調整します');
        const adjustment = (100 - total) / result.length;
        for (let i = 0; i < result.length; i++) {
            result[i].contribution_value = parseFloat((result[i].contribution_value + adjustment).toFixed(2));
        }
        
        // 調整後の合計を再確認
        const adjustedTotal = result.reduce((sum, item) => sum + item.contribution_value, 0);
        console.log(`調整後サブタスク貢献値合計: ${adjustedTotal.toFixed(2)}%`);
    }
    
    return result;
}



/**
 * 日次作業計画値の収集
 * @returns {Array} - 日次作業計画値の配列
 */
function collectDailyTaskPlans() {
    const container = document.getElementById('daily-task-plans-container');
    const plans = container.getElementsByClassName('daily-task-plan');
    
    return Array.from(plans).map(plan => {
        return {
            date: plan.querySelector('input[type="date"]').value,
            task_plan_value: parseFloat(plan.querySelector('.daily-task-plan-value').value)
        };
    });
}



/**
 * 日次作業時間計画値の収集
 * @returns {Array} - 日次作業時間計画値の配列
 */
function collectDailyTimePlans() {
    const container = document.getElementById('daily-time-plans-container');
    const plans = container.getElementsByClassName('daily-time-plan');
    
    return Array.from(plans).map(plan => {
        return {
            date: plan.querySelector('input[type="date"]').value,
            time_plan_value: parseFloat(plan.querySelector('.daily-time-plan-value').value)
        };
    });
}

/**
 * サブタスクの貢献値を再分配
 * @param {HTMLElement} changedInput - 変更された入力要素（省略可）
 */
function redistributeContributionValues(changedInput = null) {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.querySelectorAll('.subtask-row');
    const count = subtasks.length;
    
    if (count === 0) return;
    
    // 変更された入力があれば、その値を優先
    if (changedInput) {
        let value = parseFloat(changedInput.value) || 0;
        const maxValue = 100;
        
        // 最大値を超えないように制限
        if (value > maxValue) {
            value = maxValue;
            changedInput.value = maxValue;
        }
        
        // 負の値を入力できないように制限
        if (value < 0) {
            value = 0;
            changedInput.value = 0;
        }
    }
    
    // 現在の合計値を計算
    let total = 0;
    let changedValue = 0;
    const inputs = [];
    
    subtasks.forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
        const value = parseFloat(input.value) || 0;
        inputs.push(input);
        
        if (input === changedInput) {
            changedValue = value;
        } else {
            total += value;
        }
    });
    
    // 変更された入力も含めた合計
    const currentTotal = total + changedValue;
    
    // 合計が100を超える場合、他の入力を調整
    if (currentTotal > 100 && changedInput) {
        // 調整が必要な差分
        const diff = currentTotal - 100;
        const remainingInputs = inputs.filter(input => input !== changedInput);
        const remainingTotal = total;
        
        if (remainingInputs.length > 0 && remainingTotal > 0) {
            // 差分を他のサブタスクに比例配分で振り分ける
            remainingInputs.forEach(input => {
                const currentValue = parseFloat(input.value) || 0;
                const ratio = currentValue / remainingTotal;
                const adjustment = diff * ratio;
                const newValue = Math.max(0, currentValue - adjustment);
                input.value = newValue.toFixed(2);
            });
        } else if (remainingInputs.length > 0) {
            // 残りがすべて0の場合は、変更された入力を100にして他は0に
            changedInput.value = 100;
            remainingInputs.forEach(input => {
                input.value = 0;
            });
        }
    }
    
    // 合計が100未満の場合、残りを比例配分
    else if (currentTotal < 100) {
        const remaining = 100 - currentTotal;
        
        // 他の値の合計
        if (total > 0) {
            // 比例配分
            subtasks.forEach(subtask => {
                const input = subtask.querySelector('.subtask-contrib');
                if (input !== changedInput) {
                    const currentValue = parseFloat(input.value) || 0;
                    const ratio = currentValue / total;
                    const addition = remaining * ratio;
                    const newValue = currentValue + addition;
                    input.value = newValue.toFixed(2);
                }
            });
        } else {
            // すべて0の場合は均等に分配
            const remainingInputs = inputs.filter(input => input !== changedInput);
            if (remainingInputs.length > 0) {
                const equalShare = remaining / remainingInputs.length;
                remainingInputs.forEach(input => {
                    input.value = equalShare.toFixed(2);
                });
            } else if (changedInput) {
                // 入力が1つだけなら100%
                changedInput.value = 100;
            }
        }
    }
    
    validateSubtaskContributions();
}



// ページ初期化処理の追加
document.addEventListener('DOMContentLoaded', function() {
    // 現在のページのパスを取得
    const currentPage = window.location.pathname.split('/').pop();
    
    // ページに応じた初期化関数を呼び出す
    if (currentPage === 'task-create.html') {
        initTaskCreationPage();
    } else if (currentPage === 'task-edit.html') {
        initTaskEditPage();
    } else if (currentPage === 'tasks.html') {
        // タスク一覧ページの初期化は tasks.html 内で直接 ApiClient を使用して行われます
        console.log('タスク一覧ページが読み込まれました');
    }
});



// グローバルに公開する関数
window.addSubtaskField = addSubtaskField;
window.removeSubtask = removeSubtask;
window.redistributeContributionValues = redistributeContributionValues;
window.redistributeSubtaskContributions = redistributeSubtaskContributions;
window.validateSubtaskContributions = validateSubtaskContributions; 