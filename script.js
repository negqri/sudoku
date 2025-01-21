document.addEventListener("DOMContentLoaded", () => {
  const sudokuBoard = document.querySelector(".sudoku-board");
  let selectedCell = null;

  // 盤面初期化
  for (let i = 0; i < 81; i++) {
      const cell = document.createElement("div");
      cell.classList.add("sudoku-cell");
      sudokuBoard.appendChild(cell);
  }

  // 数字ボタンのイベントリスナー
  document.querySelectorAll(".number-button").forEach(button => {
      button.addEventListener("click", () => {
          if (selectedCell) {
              selectedCell.textContent = button.textContent;
          }
      });
  });

  // 各ボタンのイベントリスナー
  document.getElementById("solve-button").addEventListener("click", () => {
      const board = getBoardState();
      if (!isBoardValid(board)) {
          alert("盤面に不備があります。");
          return;
      }
      if (solveSudoku(board)) {
          setBoardState(board);
      } else {
          alert("この盤面は解けません。");
      }
  });

  document.getElementById("clear-board-button").addEventListener("click", () => {
      clearBoard();
  });

  document.getElementById("clear-cell-button").addEventListener("click", () => {
      if (selectedCell) {
          selectedCell.textContent = "";
      }
  });

  document.getElementById("recreate-board-button").addEventListener("click", () => {
      const fileInput = document.getElementById("file-input");
      fileInput.click();
  });

  // ファイル入力のイベントリスナー
  document.getElementById("file-input").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
          const board = await extractSudokuFromImage(file);
          if (board && isSudokuBoard(board)) {
              setBoardState(board);
          } else {
              alert("有効な数独の盤面を検出できませんでした。");
          }
      } catch (error) {
          alert("画像の処理中にエラーが発生しました。");
      }
  });

  // マウス選択
  sudokuBoard.addEventListener("click", (e) => {
      if (e.target.classList.contains("sudoku-cell")) {
          if (selectedCell) {
              selectedCell.classList.remove("selected");
          }
          selectedCell = e.target;
          selectedCell.classList.add("selected");
      }
  });

  // キーボード操作無効化
  document.addEventListener("keydown", (e) => e.preventDefault());

  // 盤面状態を取得
  function getBoardState() {
      const cells = document.querySelectorAll(".sudoku-cell");
      return Array.from(cells).map(cell => {
          const value = cell.textContent;
          return value === "" ? null : parseInt(value, 10);
      });
  }

  // 盤面状態を設定
  function setBoardState(board) {
      const cells = document.querySelectorAll(".sudoku-cell");
      cells.forEach((cell, index) => {
          cell.textContent = board[index] === null ? "" : board[index];
      });
  }

  // 全マスを消去
  function clearBoard() {
      const cells = document.querySelectorAll(".sudoku-cell");
      cells.forEach(cell => {
          cell.textContent = "";
          cell.classList.remove("selected");
      });
      selectedCell = null;
  }

  // 数独盤面の妥当性チェック
  function isSudokuBoard(board) {
      if (!Array.isArray(board) || board.length !== 81) return false;
      
      // 各数字が1-9の範囲内かチェック
      const validNumbers = board.every(num => 
          num === null || (Number.isInteger(num) && num >= 1 && num <= 9)
      );
      
      if (!validNumbers) return false;

      // 基本的なルールチェック（行、列、ブロックで重複がないか）
      return isBoardValid(board);
  }

  // 盤面の妥当性チェック
  function isBoardValid(board) {
      // 行のチェック
      for (let row = 0; row < 9; row++) {
          const numbers = new Set();
          for (let col = 0; col < 9; col++) {
              const num = board[row * 9 + col];
              if (num !== null) {
                  if (numbers.has(num)) return false;
                  numbers.add(num);
              }
          }
      }

      // 列のチェック
      for (let col = 0; col < 9; col++) {
          const numbers = new Set();
          for (let row = 0; row < 9; row++) {
              const num = board[row * 9 + col];
              if (num !== null) {
                  if (numbers.has(num)) return false;
                  numbers.add(num);
              }
          }
      }

      // 3x3ブロックのチェック
      for (let block = 0; block < 9; block++) {
          const numbers = new Set();
          const blockRow = Math.floor(block / 3) * 3;
          const blockCol = (block % 3) * 3;
          for (let row = 0; row < 3; row++) {
              for (let col = 0; col < 3; col++) {
                  const num = board[(blockRow + row) * 9 + (blockCol + col)];
                  if (num !== null) {
                      if (numbers.has(num)) return false;
                      numbers.add(num);
                  }
              }
          }
      }

      return true;
  }

  // 数独を解く関数 (バックトラッキング)
  function solveSudoku(board) {
      const findEmptyCell = () => {
          for (let i = 0; i < board.length; i++) {
              if (board[i] === null) return i;
          }
          return -1;
      };

      const isSafe = (num, row, col) => {
          const boxRow = Math.floor(row / 3) * 3;
          const boxCol = Math.floor(col / 3) * 3;
          for (let i = 0; i < 9; i++) {
              if (board[row * 9 + i] === num || board[i * 9 + col] === num) return false;
              const boxIndex = (boxRow + Math.floor(i / 3)) * 9 + (boxCol + (i % 3));
              if (board[boxIndex] === num) return false;
          }
          return true;
      };

      const backtrack = () => {
          const emptyIndex = findEmptyCell();
          if (emptyIndex === -1) return true;

          const row = Math.floor(emptyIndex / 9);
          const col = emptyIndex % 9;

          for (let num = 1; num <= 9; num++) {
              if (isSafe(num, row, col)) {
                  board[emptyIndex] = num;
                  if (backtrack()) return true;
                  board[emptyIndex] = null;
              }
          }
          return false;
      };

      return backtrack();
  }

  // スクショから数独盤面を読み取る
  async function extractSudokuFromImage(image) {
      try {
          const result = await Tesseract.recognize(image, 'eng', {
              tessedit_char_whitelist: '123456789'
          });
          
          const text = result.data.text.replace(/[^1-9]/g, '0');
          if (text.length < 81) {
              return null;
          }
          
          const board = text.substring(0, 81).split('').map(char => 
              char === '0' ? null : parseInt(char, 10)
          );
          
          return board;
      } catch (error) {
          console.error('画像認識エラー:', error);
          return null;
      }
  }
});