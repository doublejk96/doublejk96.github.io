function showContent(contentId)
{
    document.querySelectorAll('.content').forEach(function(content)
    {
        content.classList.remove('active');
    });

    const target = document.getElementById(contentId);
    if (target)
        target.classList.add('active');
}

const DG_BOARD_SIZE = 11;
const DG_MINE_LIMIT = 15;
const DG_ROWS = 'abcdefghijk'.split('');
const DG_HUMAN = 'human';
const DG_AI = 'ai';
const DG_STARTS = {
    human: { row: 0, col: 0 },
    ai: { row: 10, col: 10 }
};
const DG_TREASURE_KEYS = ['0,10', '10,0', '5,5'];

const deathGameState = createDeathGameState();

function createDeathGameState()
{
    return {
        phase: 'placement',
        playerMines: new Set(),
        aiMines: new Set(),
        treasures: new Set(DG_TREASURE_KEYS),
        scoredCells: new Set(),
        positions: {
            human: { ...DG_STARTS.human },
            ai: { ...DG_STARTS.ai }
        },
        scores: {
            human: 0,
            ai: 0
        },
        currentTurn: null,
        treasureCount: 0,
        gameOver: false,
        aiTimer: null,
        log: []
    };
}

function cellKey(row, col)
{
    return `${row},${col}`;
}

function coordinateName(row, col)
{
    return `${DG_ROWS[row]}${col + 1}`;
}

function isInsideBoard(row, col)
{
    return row >= 0 && row < DG_BOARD_SIZE && col >= 0 && col < DG_BOARD_SIZE;
}

function isTreasureCell(row, col)
{
    return DG_TREASURE_KEYS.includes(cellKey(row, col));
}

function isStartCell(row, col)
{
    return (row === DG_STARTS.human.row && col === DG_STARTS.human.col) ||
           (row === DG_STARTS.ai.row && col === DG_STARTS.ai.col);
}

function isMinePlacementForbidden(row, col)
{
    if (isTreasureCell(row, col) || isStartCell(row, col))
        return true;

    // 출발지 기준 가로/세로 각각 1칸 이내인 3x3 범위를 지뢰 설치 금지로 처리한다.
    return Object.values(DG_STARTS).some(function(start)
    {
        return Math.abs(row - start.row) <= 1 && Math.abs(col - start.col) <= 1;
    });
}

function getCellElement(row, col)
{
    return document.querySelector(`.deathgame-cell[data-row="${row}"][data-col="${col}"]`);
}

function createDeathGameControls()
{
    const shell = document.querySelector('.deathgame-shell');
    const matchInfo = document.querySelector('.deathgame-match-info');

    if (!shell || !matchInfo || document.getElementById('deathgame-control-panel'))
        return;

    const panel = document.createElement('div');
    panel.id = 'deathgame-control-panel';
    panel.className = 'deathgame-control-panel';
    panel.innerHTML = `
        <div class="deathgame-phase-box">
            <span id="deathgame-phase">지뢰 배치</span>
            <strong id="deathgame-instruction">내 지뢰를 15개 배치하세요.</strong>
        </div>
        <div class="deathgame-counter-box">
            <span id="deathgame-mine-counter">0 / ${DG_MINE_LIMIT}</span>
            <span id="deathgame-public-mine-count">지뢰 칸: -</span>
        </div>
        <div class="deathgame-actions">
            <button id="deathgame-confirm" type="button" disabled>지뢰 배치 완료</button>
            <button id="deathgame-restart" type="button">다시 시작</button>
        </div>
    `;

    matchInfo.insertAdjacentElement('afterend', panel);

    const logPanel = document.createElement('div');
    logPanel.id = 'deathgame-log';
    logPanel.className = 'deathgame-log';
    shell.appendChild(logPanel);

    document.getElementById('deathgame-confirm').addEventListener('click', confirmHumanMinePlacement);
    document.getElementById('deathgame-restart').addEventListener('click', restartDeathGame);
}

function renderDeathGameBoardStructure()
{
    const columnLabels = document.getElementById('deathgame-column-labels');
    const rowLabels = document.getElementById('deathgame-row-labels');
    const board = document.getElementById('deathgame-board-grid');

    if (!columnLabels || !rowLabels || !board)
        return;

    columnLabels.innerHTML = '';
    rowLabels.innerHTML = '';
    board.innerHTML = '';

    const corner = document.createElement('div');
    corner.className = 'deathgame-corner-label';
    columnLabels.appendChild(corner);

    for (let col = 1; col <= DG_BOARD_SIZE; ++col)
    {
        const label = document.createElement('div');
        label.className = 'deathgame-axis-label';
        label.textContent = col;
        columnLabels.appendChild(label);
    }

    DG_ROWS.forEach(function(rowLabel)
    {
        const label = document.createElement('div');
        label.className = 'deathgame-axis-label';
        label.textContent = rowLabel.toUpperCase();
        rowLabels.appendChild(label);
    });

    for (let row = 0; row < DG_BOARD_SIZE; ++row)
    {
        for (let col = 0; col < DG_BOARD_SIZE; ++col)
        {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'deathgame-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.coordinate = coordinateName(row, col);
            cell.title = coordinateName(row, col);
            cell.setAttribute('aria-label', coordinateName(row, col));
            cell.addEventListener('click', onDeathGameCellClick);
            board.appendChild(cell);
        }
    }
}

function onDeathGameCellClick(event)
{
    const cell = event.currentTarget;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (deathGameState.phase === 'placement')
    {
        toggleHumanMine(row, col);
        return;
    }

    if (deathGameState.phase === 'playing' && deathGameState.currentTurn === DG_HUMAN)
        tryHumanMove(row, col);
}

function toggleHumanMine(row, col)
{
    if (isMinePlacementForbidden(row, col))
    {
        addGameLog(`${coordinateName(row, col)}에는 지뢰를 놓을 수 없습니다.`);
        return;
    }

    const key = cellKey(row, col);

    if (deathGameState.playerMines.has(key))
    {
        deathGameState.playerMines.delete(key);
    }
    else
    {
        if (deathGameState.playerMines.size >= DG_MINE_LIMIT)
        {
            addGameLog('지뢰는 15개까지만 배치할 수 있습니다.');
            return;
        }

        deathGameState.playerMines.add(key);
    }

    renderDeathGame();
}

function confirmHumanMinePlacement()
{
    if (deathGameState.phase !== 'placement' || deathGameState.playerMines.size !== DG_MINE_LIMIT)
        return;

    generateAIMines();
    deathGameState.phase = 'playing';
    deathGameState.currentTurn = Math.random() < 0.5 ? DG_HUMAN : DG_AI;

    addGameLog('AI도 지뢰 15개 배치를 완료했습니다.');
    addGameLog(`${deathGameState.currentTurn === DG_HUMAN ? 'YOU' : 'AI'} 선공입니다.`);

    renderDeathGame();

    if (deathGameState.currentTurn === DG_AI)
        scheduleAITurn();
}

function generateAIMines()
{
    const candidates = [];

    for (let row = 0; row < DG_BOARD_SIZE; ++row)
    {
        for (let col = 0; col < DG_BOARD_SIZE; ++col)
        {
            if (!isMinePlacementForbidden(row, col))
                candidates.push(cellKey(row, col));
        }
    }

    shuffleArray(candidates);
    deathGameState.aiMines = new Set(candidates.slice(0, DG_MINE_LIMIT));
}

function shuffleArray(array)
{
    for (let i = array.length - 1; i > 0; --i)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getValidMoves(actor)
{
    const position = deathGameState.positions[actor];
    const opponent = actor === DG_HUMAN ? DG_AI : DG_HUMAN;
    const opponentPosition = deathGameState.positions[opponent];
    const moves = [];

    for (let dr = -1; dr <= 1; ++dr)
    {
        for (let dc = -1; dc <= 1; ++dc)
        {
            if (dr === 0 && dc === 0)
                continue;

            const row = position.row + dr;
            const col = position.col + dc;

            if (!isInsideBoard(row, col))
                continue;

            if (row === opponentPosition.row && col === opponentPosition.col)
                continue;

            moves.push({ row, col });
        }
    }

    return moves;
}

function tryHumanMove(row, col)
{
    if (deathGameState.gameOver || deathGameState.currentTurn !== DG_HUMAN)
        return;

    const valid = getValidMoves(DG_HUMAN).some(function(move)
    {
        return move.row === row && move.col === col;
    });

    if (!valid)
        return;

    executeMove(DG_HUMAN, row, col);
}

function executeMove(actor, row, col)
{
    if (deathGameState.gameOver)
        return;

    deathGameState.positions[actor] = { row, col };
    const key = cellKey(row, col);
    const actorName = actor === DG_HUMAN ? 'YOU' : 'AI';

    const mineCount = Number(deathGameState.playerMines.has(key)) + Number(deathGameState.aiMines.has(key));

    if (mineCount > 0)
    {
        deathGameState.scores[actor] -= 5;
        deathGameState.playerMines.delete(key);
        deathGameState.aiMines.delete(key);
        addGameLog(`${actorName} → ${coordinateName(row, col)} : 지뢰 ${mineCount}개 폭발, -5점`);
        forceReturnNearStart(actor);
    }
    else if (deathGameState.treasures.has(key))
    {
        deathGameState.treasures.delete(key);
        deathGameState.treasureCount += 1;
        const bonus = [10, 15, 20][deathGameState.treasureCount - 1];
        deathGameState.scores[actor] += bonus;
        addGameLog(`${actorName} → ${coordinateName(row, col)} : ${deathGameState.treasureCount}번째 보물 +${bonus}점`);
    }
    else if (!deathGameState.scoredCells.has(key))
    {
        const adjacentMines = countAdjacentMines(row, col);
        deathGameState.scoredCells.add(key);
        deathGameState.scores[actor] += adjacentMines;
        addGameLog(`${actorName} → ${coordinateName(row, col)} : 주변 지뢰 ${adjacentMines}개, +${adjacentMines}점`);
    }
    else
    {
        addGameLog(`${actorName} → ${coordinateName(row, col)} : 이미 점수를 획득한 칸`);
    }

    if (deathGameState.treasures.size === 0)
    {
        finishDeathGame();
        return;
    }

    deathGameState.currentTurn = actor === DG_HUMAN ? DG_AI : DG_HUMAN;
    renderDeathGame();

    if (deathGameState.currentTurn === DG_AI)
        scheduleAITurn();
}

function countAdjacentMines(row, col)
{
    let count = 0;

    for (let dr = -1; dr <= 1; ++dr)
    {
        for (let dc = -1; dc <= 1; ++dc)
        {
            if (dr === 0 && dc === 0)
                continue;

            const nr = row + dr;
            const nc = col + dc;

            if (!isInsideBoard(nr, nc))
                continue;

            const key = cellKey(nr, nc);
            if (deathGameState.playerMines.has(key)) ++count;
            if (deathGameState.aiMines.has(key)) ++count;
        }
    }

    return count;
}

function forceReturnNearStart(actor)
{
    const start = DG_STARTS[actor];
    const opponent = actor === DG_HUMAN ? DG_AI : DG_HUMAN;
    const opponentPosition = deathGameState.positions[opponent];
    const rowDirection = start.row === 0 ? 1 : -1;
    const colDirection = start.col === 0 ? 1 : -1;

    const candidates = [
        { row: start.row, col: start.col + colDirection },
        { row: start.row + rowDirection, col: start.col },
        { row: start.row + rowDirection, col: start.col + colDirection }
    ].filter(function(pos)
    {
        return !(pos.row === opponentPosition.row && pos.col === opponentPosition.col);
    });

    const destination = candidates[Math.floor(Math.random() * candidates.length)] || { ...start };
    deathGameState.positions[actor] = destination;
    addGameLog(`${actor === DG_HUMAN ? 'YOU' : 'AI'}는 ${coordinateName(destination.row, destination.col)}로 강제 이동했습니다.`);
}

function scheduleAITurn()
{
    window.clearTimeout(deathGameState.aiTimer);

    deathGameState.aiTimer = window.setTimeout(function()
    {
        if (deathGameState.phase !== 'playing' || deathGameState.currentTurn !== DG_AI || deathGameState.gameOver)
            return;

        const move = chooseAIMove();
        if (move)
            executeMove(DG_AI, move.row, move.col);
    }, 650);
}

function chooseAIMove()
{
    const moves = getValidMoves(DG_AI);
    if (moves.length === 0)
        return null;

    // AI는 플레이어 지뢰 위치를 참조하지 않는다.
    // 자기 지뢰는 피하고, 남은 보물에 가까워지는 수를 우선한다.
    const ranked = moves.map(function(move)
    {
        const key = cellKey(move.row, move.col);
        let score = Math.random() * 3;

        if (deathGameState.aiMines.has(key))
            score += 1000;

        if (deathGameState.treasures.has(key))
            score -= 500;

        let nearestTreasure = 99;
        deathGameState.treasures.forEach(function(treasureKey)
        {
            const [tr, tc] = treasureKey.split(',').map(Number);
            const distance = Math.max(Math.abs(tr - move.row), Math.abs(tc - move.col));
            nearestTreasure = Math.min(nearestTreasure, distance);
        });

        score += nearestTreasure * 10;

        if (deathGameState.scoredCells.has(key))
            score += 4;

        return { ...move, aiScore: score };
    });

    ranked.sort((a, b) => a.aiScore - b.aiScore);
    return ranked[0];
}

function finishDeathGame()
{
    deathGameState.phase = 'gameover';
    deathGameState.gameOver = true;
    deathGameState.currentTurn = null;
    window.clearTimeout(deathGameState.aiTimer);

    const humanScore = deathGameState.scores.human;
    const aiScore = deathGameState.scores.ai;
    let result = '무승부';

    if (humanScore > aiScore) result = 'YOU WIN';
    if (humanScore < aiScore) result = 'AI WIN';

    addGameLog(`게임 종료 · ${result} · YOU ${humanScore} : ${aiScore} AI`);
    renderDeathGame();
}

function restartDeathGame()
{
    window.clearTimeout(deathGameState.aiTimer);

    const fresh = createDeathGameState();
    Object.keys(deathGameState).forEach(key => delete deathGameState[key]);
    Object.assign(deathGameState, fresh);

    addGameLog('새 게임을 시작합니다. 지뢰 15개를 배치하세요.');
    renderDeathGame();
}

function getPublicMineCellCount()
{
    const unique = new Set([...deathGameState.playerMines, ...deathGameState.aiMines]);
    return unique.size;
}

function addGameLog(message)
{
    deathGameState.log.unshift(message);
    deathGameState.log = deathGameState.log.slice(0, 6);
    renderGameLog();
}

function renderGameLog()
{
    const log = document.getElementById('deathgame-log');
    if (!log)
        return;

    log.innerHTML = deathGameState.log
        .map(item => `<div>${item}</div>`)
        .join('');
}

function renderDeathGame()
{
    renderDeathGameHUD();
    renderDeathGameCells();
    renderGameLog();
}

function renderDeathGameHUD()
{
    const humanScore = document.getElementById('player1-score');
    const aiScore = document.getElementById('player2-score');
    const aiName = document.getElementById('player2-name');
    const status = document.getElementById('deathgame-match-status');
    const phase = document.getElementById('deathgame-phase');
    const instruction = document.getElementById('deathgame-instruction');
    const counter = document.getElementById('deathgame-mine-counter');
    const publicMineCount = document.getElementById('deathgame-public-mine-count');
    const confirm = document.getElementById('deathgame-confirm');

    if (humanScore) humanScore.textContent = `${deathGameState.scores.human} POINT`;
    if (aiScore) aiScore.textContent = `${deathGameState.scores.ai} POINT`;
    if (aiName) aiName.textContent = 'AI';
    if (counter) counter.textContent = `${deathGameState.playerMines.size} / ${DG_MINE_LIMIT}`;

    if (confirm)
    {
        confirm.disabled = deathGameState.phase !== 'placement' || deathGameState.playerMines.size !== DG_MINE_LIMIT;
        confirm.style.display = deathGameState.phase === 'placement' ? '' : 'none';
    }

    if (deathGameState.phase === 'placement')
    {
        if (status) status.textContent = 'MINE PLACEMENT';
        if (phase) phase.textContent = '지뢰 배치';
        if (instruction) instruction.textContent = '설치 가능한 칸을 눌러 내 지뢰 15개를 배치하세요.';
        if (publicMineCount) publicMineCount.textContent = 'AI 배치 대기';
    }
    else if (deathGameState.phase === 'playing')
    {
        if (status) status.textContent = deathGameState.currentTurn === DG_HUMAN ? 'YOUR TURN' : 'AI TURN';
        if (phase) phase.textContent = deathGameState.currentTurn === DG_HUMAN ? '내 턴' : 'AI 턴';
        if (instruction) instruction.textContent = deathGameState.currentTurn === DG_HUMAN ? '강조된 인접 칸 중 하나로 이동하세요.' : 'AI가 이동 중입니다.';
        if (publicMineCount) publicMineCount.textContent = `지뢰 칸: ${getPublicMineCellCount()}`;
    }
    else
    {
        if (status) status.textContent = 'GAME OVER';
        if (phase) phase.textContent = '게임 종료';
        if (instruction)
        {
            const h = deathGameState.scores.human;
            const a = deathGameState.scores.ai;
            instruction.textContent = h > a ? 'YOU WIN' : h < a ? 'AI WIN' : 'DRAW';
        }
        if (publicMineCount) publicMineCount.textContent = `남은 지뢰 칸: ${getPublicMineCellCount()}`;
    }
}

function renderDeathGameCells()
{
    const validHumanMoves = deathGameState.phase === 'playing' && deathGameState.currentTurn === DG_HUMAN
        ? getValidMoves(DG_HUMAN).map(move => cellKey(move.row, move.col))
        : [];
    const validMoveSet = new Set(validHumanMoves);

    for (let row = 0; row < DG_BOARD_SIZE; ++row)
    {
        for (let col = 0; col < DG_BOARD_SIZE; ++col)
        {
            const cell = getCellElement(row, col);
            if (!cell)
                continue;

            const key = cellKey(row, col);
            cell.className = 'deathgame-cell';
            cell.innerHTML = '';

            const coordinate = document.createElement('span');
            coordinate.className = 'deathgame-cell-coordinate';
            coordinate.textContent = coordinateName(row, col);
            cell.appendChild(coordinate);

            if (isStartCell(row, col))
                cell.classList.add('deathgame-start');

            if (deathGameState.treasures.has(key))
            {
                cell.classList.add('deathgame-treasure');
                appendCellSymbol(cell, '◆', 'deathgame-treasure-symbol');
            }

            if (deathGameState.phase === 'placement')
            {
                if (isMinePlacementForbidden(row, col))
                    cell.classList.add('deathgame-forbidden');
                else
                    cell.classList.add('deathgame-placeable');

                if (deathGameState.playerMines.has(key))
                {
                    cell.classList.add('deathgame-own-mine');
                    appendCellSymbol(cell, '✹', 'deathgame-mine-symbol');
                }
            }
            else
            {
                if (deathGameState.scoredCells.has(key))
                    cell.classList.add('deathgame-scored');

                if (validMoveSet.has(key))
                    cell.classList.add('deathgame-valid-move');

                if (deathGameState.gameOver)
                {
                    const remainingMineCount = Number(deathGameState.playerMines.has(key)) + Number(deathGameState.aiMines.has(key));
                    if (remainingMineCount > 0)
                        appendCellSymbol(cell, remainingMineCount === 2 ? '✹✹' : '✹', 'deathgame-revealed-mine-symbol');
                }
            }

            const humanPos = deathGameState.positions.human;
            const aiPos = deathGameState.positions.ai;

            if (humanPos.row === row && humanPos.col === col)
            {
                cell.classList.add('deathgame-human-position');
                appendCellSymbol(cell, '1', 'deathgame-player-symbol deathgame-human-symbol');
            }

            if (aiPos.row === row && aiPos.col === col)
            {
                cell.classList.add('deathgame-ai-position');
                appendCellSymbol(cell, '2', 'deathgame-player-symbol deathgame-ai-symbol');
            }
        }
    }
}

function appendCellSymbol(cell, text, className)
{
    const symbol = document.createElement('span');
    symbol.className = `deathgame-cell-symbol ${className}`;
    symbol.textContent = text;
    cell.appendChild(symbol);
}

document.addEventListener('DOMContentLoaded', function()
{
    createDeathGameControls();
    renderDeathGameBoardStructure();
    addGameLog('AI 상대가 연결되었습니다. 내 지뢰 15개를 배치하세요.');
    renderDeathGame();

    if (location.hash === '#deathgame')
        showContent('deathgame');
});
