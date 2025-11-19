document.addEventListener('DOMContentLoaded', () => {
  const gridElement = document.getElementById('crossword-grid');
  const acrossCluesElement = document.getElementById('across-clues');
  const downCluesElement = document.getElementById('down-clues');
  const checkBtn = document.getElementById('check-btn');
  const resetBtn = document.getElementById('reset-btn');
  const showAnswersBtn = document.getElementById('show-answers-btn');
  const messageElement = document.getElementById('message');

  // Crossword Data
  // Grid size: 20x20 to accommodate larger words
  const rows = 20;
  const cols = 20;

  // Words and positions (0-indexed)
  // Layout strategy: Valid intersections or standalone placement.
  const words = [
    // Across
    { word: "CONFIDENTIALITY", direction: "across", row: 10, col: 2, clue: "2. It hides amounts and balances on-chain" },
    { word: "FHE", direction: "across", row: 18, col: 1, clue: "4. A method to compute on encrypted data without seeing it" },
    { word: "TEE", direction: "across", row: 16, col: 9, clue: "3. A secure part of the processor where data stays protected" },
    { word: "SEPOLIA", direction: "across", row: 5, col: 5, clue: "10. The network where the Inco testnet currently runs" },
    { word: "LIGHTNING", direction: "across", row: 2, col: 2, clue: "6. Inco's fast, low-latency privacy layer" },

    // Down
    { word: "PRIVACY", direction: "down", row: 1, col: 18, clue: "1. Inco makes onchain actions hidden instead of public" },
    { word: "GUESSING", direction: "down", row: 1, col: 14, clue: "12. Core mechanic of the Inco Hangman game" },
    { word: "CERC20", direction: "down", row: 10, col: 0, clue: "5. A confidential version of the ERC-20 token standard" },
    { word: "FULLSTACK", direction: "down", row: 10, col: 5, clue: "14. Inco provides privacy at every level of blockchain use" },
    { word: "ENCRYPTED", direction: "down", row: 10, col: 8, clue: "11. All sensitive data stays locked and unreadable" },
    { word: "TRANSFERS", direction: "down", row: 10, col: 10, clue: "13. You can privately move assets using Inco" },
    { word: "ATLAS", direction: "down", row: 10, col: 12, clue: "7. Inco's full, heavier privacy infrastructure" },
    { word: "HANGMAN", direction: "down", row: 8, col: 9, clue: "9. A secret-word guessing game with hidden logic" },
    { word: "COMFY", direction: "down", row: 4, col: 8, clue: "8. A test dApp that lets you send private transfers" }
  ];

  // Initialize grid state
  let gridState = Array(rows).fill().map(() => Array(cols).fill(null));
  let cellElements = [];

  // Populate grid state with word metadata
  words.forEach((w, index) => {
    for (let i = 0; i < w.word.length; i++) {
      let r = w.row + (w.direction === "down" ? i : 0);
      let c = w.col + (w.direction === "across" ? i : 0);

      if (!gridState[r][c]) {
        gridState[r][c] = { letter: w.word[i], words: [], number: null };
      }
      gridState[r][c].words.push(index);

      if (i === 0) {
        gridState[r][c].number = w.clue.split('.')[0]; // Extract number from clue
      }
    }
  });

  // Render Grid
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');

      if (gridState[r][c]) {
        const input = document.createElement('input');
        input.maxLength = 1;
        input.dataset.row = r;
        input.dataset.col = c;

        if (gridState[r][c].number) {
          const num = document.createElement('span');
          num.classList.add('number');
          num.textContent = gridState[r][c].number;
          cell.appendChild(num);
        }

        cell.appendChild(input);

        // Event Listeners
        input.addEventListener('focus', () => highlightWord(r, c));
        input.addEventListener('input', (e) => handleInput(e, r, c));
        input.addEventListener('keydown', (e) => handleKeydown(e, r, c));
        input.addEventListener('click', () => highlightWord(r, c)); // Re-highlight on click

      } else {
        cell.classList.add('black');
      }

      gridElement.appendChild(cell);
      cellElements.push(cell);
    }
  }

  // Render Clues
  words.forEach((w, index) => {
    const li = document.createElement('li');
    li.textContent = w.clue;
    li.dataset.index = index;
    li.addEventListener('click', () => focusWord(index));

    if (w.direction === "across") {
      acrossCluesElement.appendChild(li);
    } else {
      downCluesElement.appendChild(li);
    }
  });

  // Input Handling
  function handleInput(e, r, c) {
    const val = e.target.value.toUpperCase();
    e.target.value = val; // Force uppercase

    if (val) {
      // Move to next cell
      moveToNextCell(r, c);
    }
  }

  function handleKeydown(e, r, c) {
    if (e.key === 'Backspace' && e.target.value === '') {
      // Move to previous cell
      moveToPrevCell(r, c);
    }
  }

  let currentDirection = "across"; // "across" or "down"
  let currentWordIndex = -1;

  function highlightWord(r, c) {
    // Determine which word to highlight based on current direction or default
    const cellData = gridState[r][c];
    if (!cellData) return;

    // Find if the cell belongs to the currently selected word
    let wordIndex = -1;

    // If we are already in a word and clicked a cell in that word, keep it
    if (currentWordIndex !== -1 && cellData.words.includes(currentWordIndex)) {
      wordIndex = currentWordIndex;
    } else {
      // Otherwise pick the first word associated with this cell
      // Prefer across if ambiguous and direction is across, etc.
      if (cellData.words.length > 1) {
        const match = cellData.words.find(idx => words[idx].direction === currentDirection);
        wordIndex = match !== undefined ? match : cellData.words[0];
      } else {
        wordIndex = cellData.words[0];
      }
    }

    currentWordIndex = wordIndex;
    const w = words[wordIndex];
    currentDirection = w.direction;

    // Clear previous highlights
    document.querySelectorAll('.cell').forEach(c => c.style.background = 'white');
    document.querySelectorAll('.cell.black').forEach(c => c.style.background = '#b8d4e8');
    document.querySelectorAll('.clues-list li').forEach(li => li.classList.remove('active'));

    // Highlight grid cells
    for (let i = 0; i < w.word.length; i++) {
      let rr = w.row + (w.direction === "down" ? i : 0);
      let cc = w.col + (w.direction === "across" ? i : 0);
      const cellIndex = rr * cols + cc;
      cellElements[cellIndex].style.background = '#e6ebff';
    }

    // Highlight clue
    const clueLi = document.querySelector(`li[data-index="${wordIndex}"]`);
    if (clueLi) clueLi.classList.add('active');
  }

  function focusWord(index) {
    const w = words[index];
    const cellIndex = w.row * cols + w.col;
    const input = cellElements[cellIndex].querySelector('input');
    if (input) {
      input.focus();
      highlightWord(w.row, w.col); // Ensure highlight logic runs
    }
  }

  function moveToNextCell(r, c) {
    if (currentWordIndex === -1) return;
    const w = words[currentWordIndex];

    // Find current position in word
    let indexInWord = -1;
    if (w.direction === 'across') {
      indexInWord = c - w.col;
    } else {
      indexInWord = r - w.row;
    }

    if (indexInWord < w.word.length - 1) {
      // Move to next
      let nextR = r + (w.direction === 'down' ? 1 : 0);
      let nextC = c + (w.direction === 'across' ? 1 : 0);
      const nextCellIndex = nextR * cols + nextC;
      const input = cellElements[nextCellIndex].querySelector('input');
      if (input) input.focus();
    }
  }

  function moveToPrevCell(r, c) {
    if (currentWordIndex === -1) return;
    const w = words[currentWordIndex];

    // Find current position in word
    let indexInWord = -1;
    if (w.direction === 'across') {
      indexInWord = c - w.col;
    } else {
      indexInWord = r - w.row;
    }

    if (indexInWord > 0) {
      // Move to prev
      let prevR = r - (w.direction === 'down' ? 1 : 0);
      let prevC = c - (w.direction === 'across' ? 1 : 0);
      const prevCellIndex = prevR * cols + prevC;
      const input = cellElements[prevCellIndex].querySelector('input');
      if (input) input.focus();
    }
  }

  // Check Answers
  checkBtn.addEventListener('click', () => {
    let allCorrect = true;
    let correctCount = 0;

    words.forEach((w, index) => {
      let wordCorrect = true;
      for (let i = 0; i < w.word.length; i++) {
        let r = w.row + (w.direction === "down" ? i : 0);
        let c = w.col + (w.direction === "across" ? i : 0);
        const cellIndex = r * cols + c;
        const input = cellElements[cellIndex].querySelector('input');
        if (input.value !== w.word[i]) {
          wordCorrect = false;
          allCorrect = false;
        }
      }

      const clueLi = document.querySelector(`li[data-index="${index}"]`);
      if (wordCorrect) {
        clueLi.classList.add('solved');
        correctCount++;
      } else {
        clueLi.classList.remove('solved');
      }
    });

    if (allCorrect) {
      messageElement.textContent = "Congratulations! You solved the puzzle! 🎉";
      messageElement.style.color = "green";
    } else {
      messageElement.textContent = `${correctCount}/${words.length} words correct. Keep trying!`;
      messageElement.style.color = "#3673F5";
    }
  });

  // Show Answers
  showAnswersBtn.addEventListener('click', () => {
    words.forEach((w, index) => {
      for (let i = 0; i < w.word.length; i++) {
        let r = w.row + (w.direction === "down" ? i : 0);
        let c = w.col + (w.direction === "across" ? i : 0);
        const cellIndex = r * cols + c;
        const input = cellElements[cellIndex].querySelector('input');
        input.value = w.word[i]; // Fill correct letter
      }

      // Mark clue as solved
      const clueLi = document.querySelector(`li[data-index="${index}"]`);
      clueLi.classList.add('solved');
    });

    messageElement.textContent = "Answers revealed! 👀";
    messageElement.style.color = "#3673F5";
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    document.querySelectorAll('input').forEach(input => input.value = '');
    document.querySelectorAll('.clues-list li').forEach(li => li.classList.remove('solved'));
    messageElement.textContent = "";
    // Reset focus to first word
    focusWord(0);
  });

});
