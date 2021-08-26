const moveset_to_char = ["U", "D", "F", "B", "R", "L"];
const suffix_to_char = ["", "'", "2"];

/**
 * Generate a random cube scramble
 * @param {number} len length of the scramble
 * @return {string[]} sequence of moves
 */
const generateScramble = (len) => {
  const temp = [];
  let latest_moveset = -2;
  let latest_moveaxis = -1;
  let before_latest_moveaxis = -2;
  for (let i = 0; i < len; i++) {
    let valid = false;
    let move;
    while (!valid) {
      move = Math.floor(Math.random() * 18);
      const new_moveset = Math.floor(move / 3);
      const new_moveaxis = Math.floor(move / 6);

      // Skip if two subsequent moves affect the same face
      if (new_moveset === latest_moveset) continue;
      // Skip if three subsequent moves are such that the first and the third may cancel each other (e.g. R L2 R')
      if (
        new_moveaxis === latest_moveaxis &&
        latest_moveaxis === before_latest_moveaxis
      )
        continue;

      valid = true;
      before_latest_moveaxis = latest_moveaxis;
      latest_moveaxis = new_moveaxis;
      latest_moveset = new_moveset;
    }
    temp[i] = move;
  }
  return temp.map(
    (index) =>
      moveset_to_char[Math.floor(index / 3)] + suffix_to_char[index % 3]
  );
};

export { generateScramble };
