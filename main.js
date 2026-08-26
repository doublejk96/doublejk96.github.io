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

function createDeathGameBoard()
{
    const navigation = document.querySelector('.navigation');
    const contents = document.querySelector('.contents');

    if (!navigation || !contents || document.getElementById('deathgame'))
        return;

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = './deathgame.css';
    document.head.appendChild(style);

    const menuItem = document.createElement('li');
    const menuLink = document.createElement('a');
    menuLink.href = '#deathgame';
    menuLink.className = 'nav__item';
    menuLink.textContent = '데스게임';
    menuLink.addEventListener('click', function(event)
    {
        event.preventDefault();
        showContent('deathgame');
        history.replaceState(null, '', '#deathgame');
    });

    menuItem.appendChild(menuLink);
    navigation.appendChild(menuItem);

    const deathGame = document.createElement('div');
    deathGame.id = 'deathgame';
    deathGame.className = 'content';

    deathGame.innerHTML = `
        <section class="deathgame-shell">
            <div class="deathgame-header">
                <div>
                    <p class="deathgame-eyebrow">ONLINE DEATH GAME</p>
                    <h1>망각의 지뢰</h1>
                </div>
                <div class="deathgame-status">
                    <span class="deathgame-status-dot"></span>
                    BOARD PROTOTYPE
                </div>
            </div>

            <div class="deathgame-match-info">
                <div class="deathgame-player-card">
                    <span class="deathgame-player-label">PLAYER 1</span>
                    <strong>대기 중</strong>
                    <span>0 POINT</span>
                </div>

                <div class="deathgame-versus">VS</div>

                <div class="deathgame-player-card">
                    <span class="deathgame-player-label">PLAYER 2</span>
                    <strong>대기 중</strong>
                    <span>0 POINT</span>
                </div>
            </div>

            <div class="deathgame-board-wrapper">
                <div class="deathgame-column-labels" id="deathgame-column-labels"></div>
                <div class="deathgame-board-content">
                    <div class="deathgame-row-labels" id="deathgame-row-labels"></div>
                    <div class="deathgame-board-grid" id="deathgame-board-grid"></div>
                </div>
            </div>

            <div class="deathgame-footer">
                <span>11 × 11 BOARD</span>
                <span>◆ 보물</span>
                <span>● 출발점</span>
            </div>
        </section>
    `;

    contents.appendChild(deathGame);
    renderDeathGameBoard();

    if (location.hash === '#deathgame')
        showContent('deathgame');
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

document.addEventListener('DOMContentLoaded', createDeathGameBoard);
