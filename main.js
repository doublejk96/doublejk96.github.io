function showContent(contentId)
{
    document.querySelectorAll('.content').forEach(function(content)
    {
        content.classList.remove('active');
    });

    const target = document.getElementById(contentId);
    if (target)
    {
        target.classList.add('active');
    }
}

const deathGameState = {
    mode: 'solo-ai',
    player1: {
        name: 'YOU',
        score: 0
    },
    player2: {
        name: 'AI',
        score: 0,
        isAI: true
    }
};

function connectSoloPlayerToAI()
{
    const status = document.getElementById('deathgame-match-status');
    const player2Name = document.getElementById('player2-name');

    if (!status || !player2Name)
        return;

    status.textContent = 'AI MATCHING';
    player2Name.textContent = '연결 중...';

    window.setTimeout(function()
    {
        player2Name.textContent = deathGameState.player2.name;
        status.textContent = 'AI CONNECTED';
    }, 500);
}

function renderDeathGameBoard()
{
    const boardSize = 11;
    const rowLabels = 'abcdefghijk'.split('');
    const columnLabels = document.getElementById('deathgame-column-labels');
    const rowLabelContainer = document.getElementById('deathgame-row-labels');
    const board = document.getElementById('deathgame-board-grid');

    if (!columnLabels || !rowLabelContainer || !board)
        return;

    columnLabels.innerHTML = '';
    rowLabelContainer.innerHTML = '';
    board.innerHTML = '';

    const corner = document.createElement('div');
    corner.className = 'deathgame-corner-label';
    columnLabels.appendChild(corner);

    for (let col = 1; col <= boardSize; ++col)
    {
        const label = document.createElement('div');
        label.className = 'deathgame-axis-label';
        label.textContent = col;
        columnLabels.appendChild(label);
    }

    rowLabels.forEach(function(row)
    {
        const label = document.createElement('div');
        label.className = 'deathgame-axis-label';
        label.textContent = row.toUpperCase();
        rowLabelContainer.appendChild(label);
    });

    for (let row = 0; row < boardSize; ++row)
    {
        for (let col = 0; col < boardSize; ++col)
        {
            const cell = document.createElement('button');
            const coordinate = `${rowLabels[row]}${col + 1}`;

            cell.type = 'button';
            cell.className = 'deathgame-cell';
            cell.title = coordinate;
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.coordinate = coordinate;
            cell.setAttribute('aria-label', coordinate);

            const coordinateLabel = document.createElement('span');
            coordinateLabel.className = 'deathgame-cell-coordinate';
            coordinateLabel.textContent = coordinate;
            cell.appendChild(coordinateLabel);

            const isPlayer1Start = row === 0 && col === 0;
            const isPlayer2Start = row === boardSize - 1 && col === boardSize - 1;
            const isTreasure =
                (row === 0 && col === boardSize - 1) ||
                (row === boardSize - 1 && col === 0) ||
                (row === 5 && col === 5);

            if (isTreasure)
            {
                cell.classList.add('deathgame-treasure');

                const symbol = document.createElement('span');
                symbol.className = 'deathgame-cell-symbol deathgame-treasure-symbol';
                symbol.textContent = '◆';
                cell.appendChild(symbol);
            }
            else if (isPlayer1Start || isPlayer2Start)
            {
                cell.classList.add('deathgame-start');

                const symbol = document.createElement('span');
                symbol.className = 'deathgame-cell-symbol deathgame-start-symbol';
                symbol.textContent = isPlayer1Start ? '1' : '2';
                cell.appendChild(symbol);
            }

            board.appendChild(cell);
        }
    }
}

document.addEventListener('DOMContentLoaded', function()
{
    renderDeathGameBoard();
    connectSoloPlayerToAI();

    if (location.hash === '#deathgame')
        showContent('deathgame');
});
