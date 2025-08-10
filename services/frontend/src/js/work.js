/**
 * 作業実績入力機能
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

    // 作業時間実績更新ボタン
    document.getElementById('refreshWorkTimesBtn').addEventListener('click', function() {
        const selectedTaskId = document.getElementById('taskSelect').value;
        if (selectedTaskId) {
            loadWorkTimes(selectedTaskId);
        }
    });

    // 作業時間追加ボタン
    document.getElementById('addWorkTimeBtn').addEventListener('click', function() {
        openWorkTimeModal();
    });

    // サブタスク保存ボタン
    document.getElementById('saveSubtaskBtn').addEventListener('click', saveSubtask);

    // 作業時間保存ボタン
    document.getElementById('saveWorkTimeBtn').addEventListener('click', saveWorkTime);

    // 作業時間削除ボタン
    document.getElementById('deleteWorkTimeBtn').addEventListener('click', deleteWorkTime);
}

/**
 * タスク一覧を読み込み
 */
async function loadTasks() {
    try {
        const tasks = await API.get('/tasks');
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
        const task = await API.get(`/tasks/${taskId}`);
        
        // タスク詳細を表示
        displayTaskDetails(task);
        
        // サブタスクと作業時間実績を並列で読み込み
        await Promise.all([
            loadSubtasks(taskId),
            loadWorkTimes(taskId)
        ]);
        
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
    document.getElementById('taskContent').textContent = task.task_content || '内容なし';
    document.getElementById('taskStartDate').textContent = task.start_date || '未設定';
    document.getElementById('taskDueDate').textContent = task.due_date || '未設定';
}

/**
 * サブタスク一覧を読み込み
 */
async function loadSubtasks(taskId) {
    try {
        const subtasks = await API.get(`/tasks/${taskId}/subtasks`);
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
        
    } catch (error) {
        console.error('サブタスク読み込みエラー:', error);
        showAlert('サブタスクの読み込みに失敗しました。', 'danger');
    }
}

/**
 * サブタスク要素を作成
 */
function createSubtaskElement(subtask) {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action';
    div.style.cursor = 'pointer';
    
    const completionRate = subtask.completion_rate || 0;
    const progressBarClass = completionRate === 100 ? 'bg-success' : 'bg-primary';
    
    div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
            <div class="flex-grow-1">
                <h6 class="mb-1">${subtask.subtask_name}</h6>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${progressBarClass}" role="progressbar" 
                         style="width: ${completionRate}%" aria-valuenow="${completionRate}" 
                         aria-valuemin="0" aria-valuemax="100">
                        ${completionRate}%
                    </div>
                </div>
                <small class="text-muted">実績値: ${subtask.actual_value || 0}</small>
            </div>
            <div class="ms-3">
                <i class="bi bi-pencil-square"></i>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => openSubtaskModal(subtask));
    
    return div;
}

/**
 * 作業時間実績一覧を読み込み
 */
async function loadWorkTimes(taskId) {
    try {
        const workTimes = await API.get(`/tasks/${taskId}/work-times`);
        const workTimesList = document.getElementById('workTimesList');
        
        workTimesList.innerHTML = '';
        
        if (workTimes.length === 0) {
            workTimesList.innerHTML = '<div class="text-muted text-center py-3">作業時間実績がありません</div>';
            return;
        }
        
        // 日付順でソート（新しい順）
        workTimes.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        workTimes.forEach(workTime => {
            const workTimeElement = createWorkTimeElement(workTime);
            workTimesList.appendChild(workTimeElement);
        });
        
    } catch (error) {
        console.error('作業時間実績読み込みエラー:', error);
        showAlert('作業時間実績の読み込みに失敗しました。', 'danger');
    }
}

/**
 * 作業時間実績要素を作成
 */
function createWorkTimeElement(workTime) {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action';
    div.style.cursor = 'pointer';
    
    const workHours = Math.floor(workTime.work_time / 60);
    const workMinutes = workTime.work_time % 60;
    const timeText = workHours > 0 ? `${workHours}時間${workMinutes}分` : `${workMinutes}分`;
    
    div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
            <div>
                <h6 class="mb-1">${workTime.date}</h6>
                <span class="badge bg-primary">${timeText}</span>
                <small class="text-muted ms-2">(${workTime.work_time}分)</small>
            </div>
            <div>
                <i class="bi bi-pencil-square"></i>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => openWorkTimeModal(workTime));
    
    return div;
}

/**
 * サブタスクモーダルを開く
 */
function openSubtaskModal(subtask) {
    document.getElementById('subtaskId').value = subtask.subtask_id;
    document.getElementById('subtaskNameEdit').value = subtask.subtask_name;
    document.getElementById('completionRate').value = subtask.completion_rate || 0;
    document.getElementById('actualValue').value = subtask.actual_value || 0;
    
    const modal = new bootstrap.Modal(document.getElementById('subtaskModal'));
    modal.show();
}

/**
 * 作業時間モーダルを開く
 */
function openWorkTimeModal(workTime = null) {
    const modal = new bootstrap.Modal(document.getElementById('workTimeModal'));
    const modalTitle = document.getElementById('workTimeModalTitle');
    const deleteBtn = document.getElementById('deleteWorkTimeBtn');
    
    if (workTime) {
        // 編集モード
        modalTitle.textContent = '作業時間実績編集';
        document.getElementById('workTimeId').value = workTime.work_time_id;
        document.getElementById('workDate').value = workTime.date;
        document.getElementById('workTime').value = workTime.work_time;
        deleteBtn.style.display = 'inline-block';
    } else {
        // 新規作成モード
        modalTitle.textContent = '作業時間実績追加';
        document.getElementById('workTimeId').value = '';
        document.getElementById('workDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('workTime').value = '';
        deleteBtn.style.display = 'none';
    }
    
    modal.show();
}

/**
 * サブタスクを保存
 */
async function saveSubtask() {
    try {
        const subtaskId = document.getElementById('subtaskId').value;
        const completionRate = parseFloat(document.getElementById('completionRate').value);
        const actualValue = parseInt(document.getElementById('actualValue').value) || 0;
        
        if (completionRate < 0 || completionRate > 100) {
            showAlert('完了率は0～100の範囲で入力してください。', 'warning');
            return;
        }
        
        const updateData = {
            completion_rate: completionRate,
            actual_value: actualValue
        };
        
        await API.put(`/subtasks/${subtaskId}`, updateData);
        
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
 * 作業時間実績を保存
 */
async function saveWorkTime() {
    try {
        const workTimeId = document.getElementById('workTimeId').value;
        const selectedTaskId = document.getElementById('taskSelect').value;
        const workDate = document.getElementById('workDate').value;
        const workTime = parseInt(document.getElementById('workTime').value);
        
        if (!workDate || workTime < 0) {
            showAlert('正しい日付と時間を入力してください。', 'warning');
            return;
        }
        
        const workData = {
            task_id: parseInt(selectedTaskId),
            date: workDate,
            work_time: workTime
        };
        
        if (workTimeId) {
            // 更新
            await API.put(`/work-times/${workTimeId}`, workData);
            showAlert('作業時間実績を更新しました。', 'success');
        } else {
            // 新規作成
            await API.post('/work-times', workData);
            showAlert('作業時間実績を追加しました。', 'success');
        }
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('workTimeModal'));
        modal.hide();
        
        // 作業時間実績一覧を更新
        await loadWorkTimes(selectedTaskId);
        
    } catch (error) {
        console.error('作業時間実績保存エラー:', error);
        showAlert('作業時間実績の保存に失敗しました。', 'danger');
    }
}

/**
 * 作業時間実績を削除
 */
async function deleteWorkTime() {
    if (!confirm('この作業時間実績を削除しますか？')) {
        return;
    }
    
    try {
        const workTimeId = document.getElementById('workTimeId').value;
        const selectedTaskId = document.getElementById('taskSelect').value;
        
        await API.delete(`/work-times/${workTimeId}`);
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('workTimeModal'));
        modal.hide();
        
        // 作業時間実績一覧を更新
        await loadWorkTimes(selectedTaskId);
        
        showAlert('作業時間実績を削除しました。', 'success');
        
    } catch (error) {
        console.error('作業時間実績削除エラー:', error);
        showAlert('作業時間実績の削除に失敗しました。', 'danger');
    }
}

/**
 * タスク詳細セクションを非表示にする
 */
function hideTaskDetails() {
    document.getElementById('taskDetailsSection').classList.add('d-none');
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
