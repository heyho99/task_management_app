/**
 * 作業実績入力機能
 * 
 * 統合されたrecord_works APIを使用：
 * - tasks: タスク一覧・詳細表示
 * - subtasks: サブタスク一覧・貢献値更新
 * - record_works: サブタスクレベルの作業記録（作業量と作業時間を統合）
 */

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeWorkPage();
});

/**
 * ページの初期化
 */
async function initializeWorkPage() {
    try {
        // タスク一覧を読み込み
        await loadTasks();
        
        // イベントリスナーを設定
        setupEventListeners();
        
    } catch (error) {
        console.error('ページ初期化エラー:', error);
        showAlert('ページの初期化に失敗しました。', 'danger');
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // タスク選択時のイベント
    document.getElementById('taskSelect').addEventListener('change', function() {
        const selectedTaskId = this.value;
        const loadBtn = document.getElementById('loadTaskDataBtn');
        
        if (selectedTaskId) {
            loadBtn.disabled = false;
        } else {
            loadBtn.disabled = true;
            hideTaskDetails();
        }
    });

    // 実績データ読み込みボタン
    document.getElementById('loadTaskDataBtn').addEventListener('click', async function() {
        const selectedTaskId = document.getElementById('taskSelect').value;
        if (selectedTaskId) {
            await loadTaskData(selectedTaskId);
        }
    });

    // サブタスク更新ボタン
    document.getElementById('refreshSubtasksBtn').addEventListener('click', function() {
        const selectedTaskId = document.getElementById('taskSelect').value;
        if (selectedTaskId) {
            loadSubtasks(selectedTaskId);
        }
    });

    // 作業記録追加ボタン
    document.getElementById('addRecordWorkBtn').addEventListener('click', function() {
        openRecordWorkModal();
    });

    // 作業記録保存ボタン
    document.getElementById('saveRecordWorkBtn').addEventListener('click', saveRecordWork);

    // 作業記録削除ボタン
    document.getElementById('deleteRecordWorkBtn').addEventListener('click', deleteRecordWork);
}

/**
 * タスク一覧を読み込み
 */
async function loadTasks() {
    try {
        // task-serviceのAPIエンドポイントを使用
        const response = await apiCall('task', '/tasks', 'GET');
        const tasks = response || [];
        
        const taskSelect = document.getElementById('taskSelect');
        
        // 既存のオプションをクリア（最初のデフォルトオプション以外）
        taskSelect.innerHTML = '<option value="">タスクを選択してください</option>';
        
        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.task_id;
            option.textContent = `${task.task_name} (${task.category || '未分類'})`;
            taskSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('タスク一覧読み込みエラー:', error);
        showAlert('タスク一覧の読み込みに失敗しました。', 'danger');
    }
}

/**
 * 選択されたタスクのデータを読み込み
 */
async function loadTaskData(taskId) {
    try {
        // タスク詳細を取得
        const task = await apiCall('task', `/tasks/${taskId}`, 'GET');
        
        // タスク詳細を表示
        displayTaskDetails(task);
        
        // サブタスクを読み込み（タスク詳細にサブタスクが含まれている）
        loadSubtasksFromTask(task);
        
        // タスク詳細セクションを表示
        document.getElementById('taskDetailsSection').classList.remove('d-none');
        
    } catch (error) {
        console.error('タスクデータ読み込みエラー:', error);
        showAlert('タスクデータの読み込みに失敗しました。', 'danger');
    }
}

/**
 * タスク詳細を表示
 */
function displayTaskDetails(task) {
    document.getElementById('taskName').textContent = task.task_name;
    document.getElementById('taskContent').textContent = task.task_content || '内容が設定されていません';
    document.getElementById('taskStartDate').textContent = task.start_date || '未設定';
    document.getElementById('taskDueDate').textContent = task.due_date || '未設定';
    
    // タスクの作業時間合計を表示
    const totalWorkTime = task.total_work_time || 0;
    const targetTime = task.target_time || 0;
    
    // 作業時間の表示形式を作成
    const workHours = Math.floor(totalWorkTime / 60);
    const workMinutes = totalWorkTime % 60;
    const workTimeText = totalWorkTime > 0 ? 
        (workHours > 0 ? `${workHours}時間${workMinutes}分` : `${workMinutes}分`) : 
        '0分';
    
    // 目標時間の表示形式を作成
    const targetHours = Math.floor(targetTime / 60);
    const targetMinutes = targetTime % 60;
    const targetTimeText = targetTime > 0 ? 
        (targetHours > 0 ? `${targetHours}時間${targetMinutes}分` : `${targetMinutes}分`) : 
        '未設定';
    
    // 進捗率を計算
    const progressPercentage = targetTime > 0 ? Math.min((totalWorkTime / targetTime) * 100, 100) : 0;
    
    // 残り時間を計算
    const remainingTime = targetTime > 0 ? Math.max(targetTime - totalWorkTime, 0) : 0;
    const remainingHours = Math.floor(remainingTime / 60);
    const remainingMinutes = remainingTime % 60;
    const remainingTimeText = targetTime > 0 ? 
        (remainingTime > 0 ? 
            (remainingHours > 0 ? `残り${remainingHours}時間${remainingMinutes}分` : `残り${remainingMinutes}分`) : 
            '目標達成!') : 
        '';
    
    // DOM要素を更新
    document.getElementById('taskWorkTime').textContent = workTimeText;
    document.getElementById('taskTargetTime').textContent = targetTimeText;
    document.getElementById('taskProgressPercentage').textContent = `${Math.round(progressPercentage)}%`;
    document.getElementById('taskRemainingTime').textContent = remainingTimeText;
    
    // プログレスバーを更新
    const progressBar = document.querySelector('#taskTimeProgress .progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', totalWorkTime);
        progressBar.setAttribute('aria-valuemax', targetTime);
        
        // 進捗状況に応じて色を変更
        progressBar.className = 'progress-bar bg-gradient rounded-pill';
        if (progressPercentage >= 100) {
            progressBar.classList.add('bg-success');
        } else if (progressPercentage >= 75) {
            progressBar.classList.add('bg-info');
        } else if (progressPercentage >= 50) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-danger');
        }
    }
}

/**
 * サブタスク一覧を読み込み
 */
async function loadSubtasks(taskId) {
    try {
        const subtasks = await apiCall('task', `/subtasks/task/${taskId}`, 'GET');
        displaySubtasks(subtasks);
        
    } catch (error) {
        console.error('サブタスク読み込みエラー:', error);
        showAlert('サブタスクの読み込みに失敗しました。', 'danger');
    }
}

/**
 * タスクからサブタスクを読み込み（タスク詳細取得時に使用）
 */
function loadSubtasksFromTask(task) {
    const subtasks = task.subtasks || [];
    displaySubtasks(subtasks);
}

/**
 * サブタスクを表示
 */
function displaySubtasks(subtasks) {
    const subtasksList = document.getElementById('subtasksList');
    
    subtasksList.innerHTML = '';
    
    if (subtasks.length === 0) {
        subtasksList.innerHTML = '<div class="text-muted text-center py-3">サブタスクがありません</div>';
        return;
    }
    
    subtasks.forEach(subtask => {
        const subtaskElement = createSubtaskElement(subtask);
        subtasksList.appendChild(subtaskElement);
    });
}

/**
 * サブタスク要素を作成
 */
function createSubtaskElement(subtask) {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action mb-3 border-0 shadow-sm rounded-3';
    div.style.cursor = 'pointer';
    div.style.transition = 'all 0.2s ease-in-out';
    div.setAttribute('data-subtask-id', subtask.subtask_id); // data属性を追加
    
    // ホバー効果を追加
    div.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.classList.add('shadow');
        this.classList.remove('shadow-sm');
    });
    
    div.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.classList.remove('shadow');
        this.classList.add('shadow-sm');
    });
    
    // 作業実績の表示
    const totalWork = subtask.total_work || 0;
    const totalWorkTime = subtask.total_work_time || 0;
    const workDays = subtask.work_days || 0;
    
    // 作業時間の表示形式を作成
    const workHours = Math.floor(totalWorkTime / 60);
    const workMinutes = totalWorkTime % 60;
    const timeText = totalWorkTime > 0 ? 
        (workHours > 0 ? `${workHours}時間${workMinutes}分` : `${workMinutes}分`) : 
        '0分';
    
    // 作業量のプログレス計算（100を満点とする）
    const workProgress = Math.min(totalWork, 100);
    const workProgressPercentage = workProgress;
    
    div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center p-3">
            <div class="flex-grow-1">
                <!-- サブタスク名と貢献値（横並び） -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 text-dark fw-bold">${subtask.subtask_name}</h6>
                    <div class="ms-2">
                        <span class="badge bg-gradient bg-warning text-dark px-2 py-1 rounded-pill">
                            <i class="bi bi-star-fill me-1"></i>
                            ${subtask.contribution_value || 0}
                        </span>
                    </div>
                </div>
                
                <!-- 累計作業量（プログレスバー付き） -->
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted fw-semibold">
                            <i class="bi bi-bar-chart-fill text-primary me-1"></i>
                            累計作業量
                        </small>
                        <span class="badge bg-gradient bg-primary text-white px-2 py-1 rounded-pill">${totalWork}/100</span>
                    </div>
                    <div class="progress rounded-pill" style="height: 12px;">
                        <div class="progress-bar bg-gradient bg-primary rounded-pill" role="progressbar" 
                             style="width: ${workProgressPercentage}%" 
                             aria-valuenow="${totalWork}" aria-valuemin="0" aria-valuemax="100">
                        </div>
                    </div>
                </div>
                
                <!-- 累計作業時間と作業日数（横並び・大きく表示） -->
                <div class="row g-2">
                    <div class="col-6">
                        <div class="p-3 bg-gradient bg-light border border-success border-opacity-25 rounded-3">
                            <div class="d-flex align-items-center mb-1">
                                <i class="bi bi-clock-fill text-success me-2" style="font-size: 1.1em;"></i>
                                <div class="fw-bold text-success" style="font-size: 1.3em;">${timeText}</div>
                            </div>
                            <small class="text-muted fw-semibold">累計作業時間</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="p-3 bg-gradient bg-light border border-info border-opacity-25 rounded-3">
                            <div class="d-flex align-items-center mb-1">
                                <i class="bi bi-calendar-check-fill text-info me-2" style="font-size: 1.1em;"></i>
                                <div class="fw-bold text-info" style="font-size: 1.3em;">${workDays}日</div>
                            </div>
                            <small class="text-muted fw-semibold">作業日数</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ms-4 d-flex align-items-center">
                <i class="bi bi-pencil-square text-primary" style="font-size: 1.5em;"></i>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => openSubtaskModal(subtask));
    
    return div;
}

/**
 * サブタスクモーダルを開く
 */
async function openSubtaskModal(subtask) {
    document.getElementById('subtaskId').value = subtask.subtask_id;
    document.getElementById('subtaskNameDisplay').textContent = subtask.subtask_name;
    document.getElementById('contributionValueDisplay').textContent = subtask.contribution_value || 0;
    
    // 作業実績情報を表示
    const totalWork = subtask.total_work || 0;
    const totalWorkTime = subtask.total_work_time || 0;
    const workDays = subtask.work_days || 0;
    
    // 作業時間の表示形式を作成
    const workHours = Math.floor(totalWorkTime / 60);
    const workMinutes = totalWorkTime % 60;
    const timeText = totalWorkTime > 0 ? 
        (workHours > 0 ? `${workHours}時間${workMinutes}分` : `${workMinutes}分`) : 
        '0分';
    
    // 作業実績サマリーを表示
    document.getElementById('totalWorkDisplay').textContent = `${totalWork}/100`;
    document.getElementById('totalWorkTimeDisplay').textContent = timeText;
    document.getElementById('workDaysDisplay').textContent = `${workDays}日`;
    
    // プログレスバーを更新
    updateProgressBars(totalWork, totalWorkTime, workDays);
    
    // 作業記録一覧を読み込み
    await loadRecordWorks(subtask.subtask_id);
    
    const modal = new bootstrap.Modal(document.getElementById('subtaskModal'));
    modal.show();
}

/**
 * モーダル内のプログレスバーを更新
 */
function updateProgressBars(totalWork, totalWorkTime, workDays) {
    // 作業量のプログレスバー（100を満点とする）
    const workProgress = Math.min(totalWork, 100);
    const workProgressBar = document.querySelector('#totalWorkProgress .progress-bar');
    if (workProgressBar) {
        workProgressBar.style.width = `${workProgress}%`;
        workProgressBar.setAttribute('aria-valuenow', totalWork);
    }
    
    // 作業時間は累積値のみ表示（プログレスバーなし）
    const totalWorkTimeMinutes = document.getElementById('totalWorkTimeMinutes');
    if (totalWorkTimeMinutes) {
        totalWorkTimeMinutes.textContent = `(${totalWorkTime}分)`;
    }
}

/**
 * サブタスクデータを再読み込みして表示を更新
 */
async function refreshSubtaskData(subtaskId) {
    try {
        // 現在選択されているタスクIDを取得
        const selectedTaskId = document.getElementById('taskSelect').value;
        if (!selectedTaskId) return;
        
        // タスクデータを再読み込み
        await loadTaskData(selectedTaskId);
        
        // モーダルが開いている場合は、サブタスクデータを更新
        const subtaskIdInput = document.getElementById('subtaskId');
        if (subtaskIdInput && subtaskIdInput.value === subtaskId) {
            // 更新されたサブタスクデータを取得
            const subtasks = await apiCall('task', `/subtasks/task/${selectedTaskId}`, 'GET');
            const updatedSubtask = subtasks.find(s => s.subtask_id === parseInt(subtaskId));
            
            if (updatedSubtask) {
                // モーダル内の表示を更新
                const totalWork = updatedSubtask.total_work || 0;
                const totalWorkTime = updatedSubtask.total_work_time || 0;
                const workDays = updatedSubtask.work_days || 0;
                
                // 作業時間の表示形式を作成
                const workHours = Math.floor(totalWorkTime / 60);
                const workMinutes = totalWorkTime % 60;
                const timeText = totalWorkTime > 0 ? 
                    (workHours > 0 ? `${workHours}時間${workMinutes}分` : `${workMinutes}分`) : 
                    '0分';
                
                // サマリー表示を更新
                document.getElementById('totalWorkDisplay').textContent = `${totalWork}/100`;
                document.getElementById('totalWorkTimeDisplay').textContent = timeText;
                document.getElementById('workDaysDisplay').textContent = `${workDays}日`;
                
                // 作業時間の分数表示も更新
                const totalWorkTimeMinutes = document.getElementById('totalWorkTimeMinutes');
                if (totalWorkTimeMinutes) {
                    totalWorkTimeMinutes.textContent = `(${totalWorkTime}分)`;
                }
                
                // プログレスバーを更新（作業量のみ）
                updateProgressBars(totalWork, totalWorkTime, workDays);
            }
        }
        
    } catch (error) {
        console.error('サブタスクデータ更新エラー:', error);
    }
}

/**
 * 作業記録一覧を読み込み
 */
async function loadRecordWorks(subtaskId) {
    try {
        const recordWorks = await apiCall('task', `/subtasks/${subtaskId}/record-works`, 'GET');
        displayRecordWorks(recordWorks);
        
    } catch (error) {
        console.error('作業記録読み込みエラー:', error);
        showAlert('作業記録の読み込みに失敗しました。', 'danger');
        
        // エラー時は空のリストを表示
        const recordWorksList = document.getElementById('recordWorksList');
        recordWorksList.innerHTML = '<div class="text-muted text-center py-3">作業記録の読み込みに失敗しました</div>';
    }
}

/**
 * 作業記録一覧を表示
 */
function displayRecordWorks(recordWorks) {
    const recordWorksList = document.getElementById('recordWorksList');
    
    if (recordWorks.length === 0) {
        recordWorksList.innerHTML = '<div class="text-muted text-center py-3">作業記録がありません</div>';
        return;
    }
    
    recordWorksList.innerHTML = '';
    recordWorks.forEach(recordWork => {
        const recordWorkElement = createRecordWorkElement(recordWork);
        recordWorksList.appendChild(recordWorkElement);
    });
}


/**
 * 作業記録要素を作成
 */
function createRecordWorkElement(recordWork) {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action';
    div.style.cursor = 'pointer';
    
    // 作業時間の表示形式を作成
    const workTime = recordWork.work_time || 0;
    const workHours = Math.floor(workTime / 60);
    const workMinutes = workTime % 60;
    const timeText = workTime > 0 ? 
        (workHours > 0 ? `${workHours}時間${workMinutes}分` : `${workMinutes}分`) : 
        '未入力';
    
    div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
            <div>
                <h6 class="mb-1">${formatDate(recordWork.date)}</h6>
                <div class="mb-1">
                    <span class="badge bg-primary me-2">作業量: ${recordWork.work}</span>
                    <span class="badge bg-info">時間: ${timeText}</span>
                </div>
                ${workTime > 0 ? `<small class="text-muted">(${workTime}分)</small>` : ''}
            </div>
            <div>
                <i class="bi bi-pencil-square"></i>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => openRecordWorkModal(recordWork));
    
    return div;
}

/**
 * 作業記録モーダルを開く
 */
function openRecordWorkModal(recordWork = null) {
    const modalTitle = document.getElementById('recordWorkModalTitle');
    const deleteBtn = document.getElementById('deleteRecordWorkBtn');
    
    if (recordWork) {
        // 編集モード
        modalTitle.textContent = '作業記録編集';
        document.getElementById('recordWorkId').value = recordWork.record_work_id;
        document.getElementById('recordWorkDate').value = recordWork.date;
        document.getElementById('recordWork').value = recordWork.work;
        document.getElementById('workTimeAmount').value = recordWork.work_time || 0;
        deleteBtn.style.display = 'inline-block';
    } else {
        // 新規作成モード
        modalTitle.textContent = '作業記録新規作成';
        document.getElementById('recordWorkId').value = '';
        document.getElementById('recordWorkDate').value = '';
        document.getElementById('recordWork').value = '';
        document.getElementById('workTimeAmount').value = '';
        deleteBtn.style.display = 'none';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('recordWorkModal'));
    modal.show();
}

/**
 * 作業記録を保存
 */
async function saveRecordWork() {
    try {
        const recordWorkId = document.getElementById('recordWorkId').value;
        const subtaskId = document.getElementById('subtaskId').value;
        const workTimeValue = document.getElementById('workTimeAmount').value;
        const recordWorkData = {
            date: document.getElementById('recordWorkDate').value,
            work: parseInt(document.getElementById('recordWork').value),
            work_time: workTimeValue ? parseInt(workTimeValue) : 0
        };
        
        // バリデーション
        if (!recordWorkData.date) {
            showAlert('作業日は必須です。', 'warning');
            return;
        }
        
        if (recordWorkData.work < 0 || recordWorkData.work > 100) {
            showAlert('作業量は0～100の範囲で入力してください。', 'warning');
            return;
        }
        
        if (recordWorkData.work_time < 0) {
            showAlert('作業時間は0以上で入力してください。', 'warning');
            return;
        }
        
        let result;
        if (recordWorkId) {
            // 更新
            result = await apiCall('task', `/record-works/${recordWorkId}`, 'PUT', recordWorkData);
        } else {
            // 新規作成
            result = await apiCall('task', `/subtasks/${subtaskId}/record-works`, 'POST', recordWorkData);
        }
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('recordWorkModal'));
        modal.hide();
        
        // 作業記録一覧を再読み込み
        await loadRecordWorks(subtaskId);
        
        // サブタスクデータを再読み込みして表示を更新
        await refreshSubtaskData(subtaskId);
        
        showAlert(recordWorkId ? '作業記録を更新しました。' : '作業記録を作成しました。', 'success');
        
    } catch (error) {
        console.error('作業記録保存エラー:', error);
        if (error.detail && error.detail.includes('既に存在します')) {
            showAlert('その日付の作業記録は既に存在します。', 'warning');
        } else {
            showAlert('作業記録の保存に失敗しました。', 'danger');
        }
    }
}

/**
 * 作業記録を削除
 */
async function deleteRecordWork() {
    if (!confirm('この作業記録を削除しますか？')) {
        return;
    }
    
    try {
        const recordWorkId = document.getElementById('recordWorkId').value;
        const subtaskId = document.getElementById('subtaskId').value;
        
        await apiCall('task', `/record-works/${recordWorkId}`, 'DELETE');
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('recordWorkModal'));
        modal.hide();
        
        // 作業記録一覧を再読み込み
        await loadRecordWorks(subtaskId);
        
        // サブタスクデータを再読み込みして表示を更新
        await refreshSubtaskData(subtaskId);
        
        showAlert('作業記録を削除しました。', 'success');
        
    } catch (error) {
        console.error('作業記録削除エラー:', error);
        showAlert('作業記録の削除に失敗しました。', 'danger');
    }
}

/**
 * サブタスクを保存
 */
async function saveSubtask() {
    try {
        const subtaskId = document.getElementById('subtaskId').value;
        const completionRate = parseFloat(document.getElementById('completionRate').value);
        const contributionValue = parseInt(document.getElementById('actualValue').value) || 0;
        
        if (completionRate < 0 || completionRate > 100) {
            showAlert('完了率は0～100の範囲で入力してください。', 'warning');
            return;
        }
        
        if (contributionValue < 0 || contributionValue > 100) {
            showAlert('貢献値は0～100の範囲で入力してください。', 'warning');
            return;
        }
        
        const updateData = {
            subtask_name: document.getElementById('subtaskNameEdit').value,
            contribution_value: contributionValue
            // 注意: 現在のtask-serviceではprogressフィールドは更新APIでサポートされていない可能性があります
        };
        
        await apiCall('task', `/subtasks/${subtaskId}`, 'PUT', updateData);
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('subtaskModal'));
        modal.hide();
        
        // サブタスク一覧を更新
        const selectedTaskId = document.getElementById('taskSelect').value;
        await loadSubtasks(selectedTaskId);
        
        showAlert('サブタスクを更新しました。', 'success');
        
    } catch (error) {
        console.error('サブタスク保存エラー:', error);
        showAlert('サブタスクの保存に失敗しました。', 'danger');
    }
}

/**
 * タスク詳細セクションを非表示にする
 */
function hideTaskDetails() {
    document.getElementById('taskDetailsSection').classList.add('d-none');
}

/**
 * 日付をフォーマット
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * ローディング状態を表示
 */
function showLoading(element) {
    element.innerHTML = `
        <div class="d-flex justify-content-center align-items-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-2">読み込み中...</span>
        </div>
    `;
}

/**
 * エラー状態を表示
 */
function showError(element, message) {
    element.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            <div class="mt-2">${message}</div>
        </div>
    `;
}

/**
 * アラートを表示
 */
function showAlert(message, type = 'info') {
    // 既存のアラートを削除
    const existingAlert = document.querySelector('.alert-custom');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // 新しいアラートを作成
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-custom`;
    alertDiv.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // ページの最上部に挿入
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);
    
    // 5秒後に自動で消去
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
