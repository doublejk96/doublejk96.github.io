// 데스게임 규칙 보정
// 1) 지뢰 설치 금지: 양쪽 출발점 기준 가로/세로 ±2칸(5x5)
// 2) 지뢰 폭발 후: 자기 출발점에서 1칸 떨어진 주변 3칸 중 복귀
//    - 플레이어는 직접 선택
//    - AI는 자동 선택

isMinePlacementForbidden = function(row, col)
{
    if (isTreasureCell(row, col) || isStartCell(row, col))
        return true;

    return Object.values(DG_STARTS).some(function(start)
    {
        return Math.abs(row - start.row) <= 2 && Math.abs(col - start.col) <= 2;
    });
};

function getReturnCandidates(actor)
{
    const start = DG_STARTS[actor];
    const opponent = actor === DG_HUMAN ? DG_AI : DG_HUMAN;
    const opponentPosition = deathGameState.positions[opponent];
    const rowDirection = start.row === 0 ? 1 : -1;
    const colDirection = start.col === 0 ? 1 : -1;

    return [
        { row: start.row, col: start.col + colDirection },
        { row: start.row + rowDirection, col: start.col },
        { row: start.row + rowDirection, col: start.col + colDirection }
    ].filter(function(pos)
    {
        return isInsideBoard(pos.row, pos.col) &&
               !(pos.row === opponentPosition.row && pos.col === opponentPosition.col);
    });
}

function completeHumanReturn(row, col)
{
    if (deathGameState.phase !== 'returning')
        return;

    const candidates = deathGameState.returnCandidates || [];
    const valid = candidates.some(function(pos)
    {
        return pos.row === row && pos.col === col;
    });

    if (!valid)
        return;

    deathGameState.positions.human = { row, col };
    deathGameState.returnCandidates = [];
    deathGameState.phase = 'playing';
    deathGameState.currentTurn = DG_AI;

    addGameLog(`YOU는 ${coordinateName(row, col)}로 복귀했습니다.`);
    renderDeathGame();
    scheduleAITurn();
}

onDeathGameCellClick = function(event)
{
    const cell = event.currentTarget;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (deathGameState.phase === 'placement')
    {
        toggleHumanMine(row, col);
        return;
    }

    if (deathGameState.phase === 'returning')
    {
        completeHumanReturn(row, col);
        return;
    }

    if (deathGameState.phase === 'playing' && deathGameState.currentTurn === DG_HUMAN)
        tryHumanMove(row, col);
};

executeMove = function(actor, row, col)
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

        const candidates = getReturnCandidates(actor);

        if (actor === DG_HUMAN)
        {
            deathGameState.phase = 'returning';
            deathGameState.currentTurn = DG_HUMAN;
            deathGameState.returnCandidates = candidates;
            addGameLog('시작점 주변의 강조된 칸 중 하나를 선택해 복귀하세요.');
            renderDeathGame();
            return;
        }

        const destination = candidates[Math.floor(Math.random() * candidates.length)] || { ...DG_STARTS.ai };
        deathGameState.positions.ai = destination;
        addGameLog(`AI는 ${coordinateName(destination.row, destination.col)}로 복귀했습니다.`);
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
};

const dgBaseRenderDeathGame = renderDeathGame;
renderDeathGame = function()
{
    dgBaseRenderDeathGame();

    if (deathGameState.phase !== 'returning')
        return;

    const status = document.getElementById('deathgame-match-status');
    const phase = document.getElementById('deathgame-phase');
    const instruction = document.getElementById('deathgame-instruction');
    const publicMineCount = document.getElementById('deathgame-public-mine-count');

    if (status) status.textContent = 'RETURN SELECT';
    if (phase) phase.textContent = '복귀 위치 선택';
    if (instruction) instruction.textContent = '시작점 기준 1칸 범위의 강조된 칸 중 하나를 선택하세요.';
    if (publicMineCount) publicMineCount.textContent = `지뢰 칸: ${getPublicMineCellCount()}`;

    (deathGameState.returnCandidates || []).forEach(function(pos)
    {
        const cell = getCellElement(pos.row, pos.col);
        if (cell)
            cell.classList.add('deathgame-valid-move');
    });
};
