"use strict";

// Begin: should remove after find out what it used for.
var ORB_X_SEP = 64;
var ORB_Y_SEP = 64;
var ORB_WIDTH = 60;
var ORB_HEIGHT = 60;
function Coordinate(row, col) {
  this.row = row || 0;
  this.col = col || 0;
}
Coordinate.prototype.getXY = function () {
  var x = this.col * ORB_X_SEP + ORB_WIDTH / 2;
  var y = this.row * ORB_Y_SEP + ORB_HEIGHT / 2;
  return { x: x, y: y };
};
// End

const MatchStyle = Object.freeze({
  None: "none",
  Row: "row",
  TPA: "tpa",
  VDP: "vdp",
  L: "l",
  Cross: "cross",
  T: "t",
});

export default function Optimizer(opts) {
  var _debug = true;
  var _rows = opts["rows"];
  var _cols = opts["cols"];
  var _sorting = opts["sorting"];
  var _max_path = opts["max_path"]; // Computation
  var _is_8_dir_movement_supported = opts["is_8_dir_movement"];
  var _solutions = []; // was global_solutions
  var _unsimplified_solutions = []; // was global_unsimplified
  var _board; // was global_board. Storing current board data that going to solve, the format is diff with board.js
  var _max_solutions_count;
  var TYPES = 9;
  var MULTI_ORB_BONUS = 0.25;
  var COMBO_BONUS = 0.25;
  var _max_length = opts["max_length"];
  var _current_solutions_max_length = opts["max_length"]; // save the max length for solved solutions. So changing max_length by UI doesn't affect lengthenSolution.
  var _multiple_formula = {};
  var _weights = [];

  // private methods
  var _maxSolutionCount = function () {
    return _rows * _cols * _max_path;
  };
  var _makeRC = function (row, col) {
    return { row: row, col: col };
  };
  var _makeMatch = function (type, count, matchStyle) {
    return { type: type, count: count, matchStyle: matchStyle };
  };
  var _copyRC = function (rc) {
    return { row: rc.row, col: rc.col };
  };
  var _equalsXY = function (a, b) {
    return a.x == b.x && a.y == b.y;
  };
  var _equalsRC = function (a, b) {
    return a.row == b.row && a.col == b.col;
  };
  var _initBoard = function () {
    // was create_empty_board
    var result = new Array(_rows);
    for (var i = 0; i < _rows; ++i) {
      result[i] = new Array(_cols);
    }
    return result;
  };
  var _equalsMatches = function (a, b) {
    if (a.length != b.length) {
      return false;
    }
    return a.every(function (am, i) {
      var bm = b[i];
      return am.type == bm.type && am.count == bm.count;
    });
  };
  var _copyBoard = function (board) {
    return board.map(function (a) {
      return a.slice();
    });
  };
  var _makeSeedSolution = function (board) {
    // was make_solution
    return {
      board: _copyBoard(board),
      cursor: _makeRC(0, 0),
      init_cursor: _makeRC(0, 0),
      path: [],
      is_done: false,
      weight: 0,
      mult: _computeMult(board),
      matches: [],
    };
  };
  var _computeMult = function (paramBoard) {
    var board = _copyBoard(paramBoard);

    var all_matches = [];
    while (true) {
      var matches = _findMatches(board);
      if (matches.matches.length == 0) {
        break;
      }
      _inPlaceRemoveMatches(board, matches.board);
      _inPlaceDropEmptySpaces(board);
      all_matches = all_matches.concat(matches.matches);
    }

    var combo_multiple = 1;
    var orbs_multiple = 1;
    var connected_orbs_multiple = 1;
    // combo_mode: true, combo_from: 6, combo_multiple: 1.2, combo_additional_multiple: 0.2, combo_upto: 10
    // matching in-game skill type 66, 98, 104
    if (_multiple_formula.combo_mode) {
      if (all_matches.length >= _multiple_formula.combo_from) {
        var combo_count = all_matches.length;
        if (combo_count > _multiple_formula.combo_upto) {
          combo_count = _multiple_formula.combo_upto;
        }
        var additional_combo = combo_count - _multiple_formula.combo_from;
        combo_multiple =
          _multiple_formula.combo_multiple +
          additional_combo * _multiple_formula.combo_additional_multiple;
      }
    }
    // orbs_mode: true, orbs: ['0','1','2','3'], orbs_count_from: 4, orbs_multiple: 5, orbs_additional_multiple: 0.5, orbs_count_upto: 5
    // matching in-game skill type 61
    if (_multiple_formula.orbs_mode) {
      var matched_orbs = [];
      all_matches.forEach(function (m) {
        matched_orbs.push(m.type);
      });
      var matched_orbs_count = 0;
      _multiple_formula.orbs.forEach(function (need_orb) {
        if (matched_orbs.indexOf(need_orb) !== -1) {
          matched_orbs_count++;
        }
      });
      if (matched_orbs_count > _multiple_formula.orbs_count_upto) {
        matched_orbs_count = _multiple_formula.orbs_count_upto;
      }
      if (matched_orbs_count >= _multiple_formula.orbs_count_from) {
        var additional_count =
          matched_orbs_count - _multiple_formula.orbs_count_from;
        orbs_multiple =
          _multiple_formula.orbs_multiple +
          additional_count * _multiple_formula.orbs_additional_multiple;
      }
    }
    // matching in-game skill 119
    if (_multiple_formula.connected_orbs_mode) {
      all_matches.forEach(function (m) {
        var tmp_connected_orbs_multiple = 0;
        if (_multiple_formula.connected_orbs.indexOf(m.type) !== -1) {
          // is required color
          if (m.count >= _multiple_formula.connected_count_from) {
            var additional_connected =
              m.count - _multiple_formula.connected_count_from;
            var allowed_additional_connected =
              _multiple_formula.connected_count_upto -
              _multiple_formula.connected_count_from;
            if (additional_connected > allowed_additional_connected) {
              additional_connected = allowed_additional_connected; // max
            }
            tmp_connected_orbs_multiple =
              _multiple_formula.connected_multiple +
              additional_connected *
                _multiple_formula.connected_additional_multiple;
          }
          if (tmp_connected_orbs_multiple > connected_orbs_multiple) {
            connected_orbs_multiple = tmp_connected_orbs_multiple;
          }
        }
      });
    }

    // TODO, not support the follow skill type yet:
    //   101 (just X combo, no more no less, only for Monster 1604)
    //   124
    //   150 (X color connected orbs x 5 with plus)

    // base multiple (in-game type 11, 22, 26, 28, 29, 30, 31, 40, 45, 62, 65, 69, 75, 76, 77, 79, 105, 108, 111, 114, 121, 125, 129, 137, 155)
    // * combine orbs mode * combo mode result, and friend.
    var final_multi =
      _multiple_formula.base_multiple *
      combo_multiple *
      orbs_multiple *
      connected_orbs_multiple *
      (_multiple_formula.base_multiple *
        combo_multiple *
        orbs_multiple *
        connected_orbs_multiple);
    return final_multi;
  };
  var _copySolutionWithCursor = function (solution, i, j, init_cursor) {
    var complexity = _getSimplePathXYs(solution).length - 1;
    return {
      board: _copyBoard(solution.board),
      cursor: _makeRC(i, j),
      init_cursor: init_cursor || _makeRC(i, j),
      path: solution.path.slice(),
      is_done: solution.is_done,
      weight: 0,
      complexity: complexity,
      mult: _computeMult(solution.board),
      matches: [],
    };
  };
  var _copySolution = function (solution) {
    return _copySolutionWithCursor(
      solution,
      solution.cursor.row,
      solution.cursor.col,
      solution.init_cursor,
    );
  };
  var _findMatches = function (board) {
    var match_board = _initBoard();

    // 1. filter all 3+ consecutives.
    //  (a) horizontals
    for (var i = 0; i < _rows; ++i) {
      var prev_1_orb = "X";
      var prev_2_orb = "X";
      for (var j = 0; j < _cols; ++j) {
        var cur_orb = board[i][j];
        if (
          prev_1_orb == prev_2_orb &&
          prev_2_orb == cur_orb &&
          cur_orb != "X"
        ) {
          match_board[i][j] = cur_orb;
          match_board[i][j - 1] = cur_orb;
          match_board[i][j - 2] = cur_orb;
        }
        prev_1_orb = prev_2_orb;
        prev_2_orb = cur_orb;
      }
    }
    //  (b) verticals
    for (var j = 0; j < _cols; ++j) {
      var prev_1_orb = "X";
      var prev_2_orb = "X";
      for (var i = 0; i < _rows; ++i) {
        var cur_orb = board[i][j];
        if (
          prev_1_orb == prev_2_orb &&
          prev_2_orb == cur_orb &&
          cur_orb != "X"
        ) {
          match_board[i][j] = cur_orb;
          match_board[i - 1][j] = cur_orb;
          match_board[i - 2][j] = cur_orb;
        }
        prev_1_orb = prev_2_orb;
        prev_2_orb = cur_orb;
      }
    }

    var scratch_board = _copyBoard(match_board);

    // 2. enumerate the matches by flood-fill.
    var matches = [];
    if (_rows == "4") {
      var thisMatch = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ];
    } else if (_rows == "5") {
      var thisMatch = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];
    } else if (_rows == "6") {
      var thisMatch = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ];
    }
    for (var i = 0; i < _rows; ++i) {
      for (var j = 0; j < _cols; ++j) {
        var cur_orb = scratch_board[i][j];
        if (typeof cur_orb == "undefined") {
          continue;
        }
        var stack = [_makeRC(i, j)];
        var count = 0;
        if (_rows == "4") {
          var thisMatch = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
          ];
        } else if (_rows == "5") {
          var thisMatch = [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
          ];
        } else if (_rows == "6") {
          var thisMatch = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
          ];
        }
        while (stack.length) {
          var n = stack.pop();
          if (scratch_board[n.row][n.col] != cur_orb) {
            continue;
          }
          ++count;
          scratch_board[n.row][n.col] = undefined;
          thisMatch[n.row][n.col] = 1;
          if (n.row > 0) {
            stack.push(_makeRC(n.row - 1, n.col));
          }
          if (n.row < _rows - 1) {
            stack.push(_makeRC(n.row + 1, n.col));
          }
          if (n.col > 0) {
            stack.push(_makeRC(n.row, n.col - 1));
          }
          if (n.col < _cols - 1) {
            stack.push(_makeRC(n.row, n.col + 1));
          }
        }
        //
        let matchStyle = MatchStyle.None;
        if (count == 4) {
          matchStyle = MatchStyle.TPA;
        }
        if (count == 9) {
          // vdp check
          for (var k = 0; k < _rows - 2; ++k) {
            for (var l = 0; l < _cols - 2; ++l) {
              if (
                thisMatch[k][l] === 1 &&
                thisMatch[k][l + 1] === 1 &&
                thisMatch[k][l + 2] === 1 &&
                thisMatch[k + 1][l] === 1 &&
                thisMatch[k + 1][l + 1] === 1 &&
                thisMatch[k + 1][l + 2] === 1 &&
                thisMatch[k + 2][l] === 1 &&
                thisMatch[k + 2][l + 1] === 1 &&
                thisMatch[k + 2][l + 2] === 1
              ) {
                matchStyle = MatchStyle.VDP;
              }
            }
          }
        }
        if (count == 5) {
          for (var k = 0; k < _rows - 2; ++k) {
            for (var l = 0; l < _cols - 2; ++l) {
              if (
                thisMatch[k][l] === 0 &&
                thisMatch[k][l + 1] === 1 &&
                thisMatch[k][l + 2] === 0 &&
                thisMatch[k + 1][l] === 1 &&
                thisMatch[k + 1][l + 1] === 1 &&
                thisMatch[k + 1][l + 2] === 1 &&
                thisMatch[k + 2][l] === 0 &&
                thisMatch[k + 2][l + 1] === 1 &&
                thisMatch[k + 2][l + 2] === 0
              ) {
                matchStyle = MatchStyle.Cross;
              } else if (
                (thisMatch[k][l + 2] === 1 && thisMatch[k + 2][l] === 1) ||
                (thisMatch[k][l] === 1 && thisMatch[k + 2][l + 2] === 1)
              ) {
                matchStyle = MatchStyle.L;
              } else if (
                (thisMatch[k][l] === 1 &&
                  thisMatch[k][l + 2] === 1 &&
                  thisMatch[k + 2][l + 1] === 1) ||
                (thisMatch[k + 2][l] === 1 &&
                  thisMatch[k + 2][l + 2] === 1 &&
                  thisMatch[k][l + 1] === 1) ||
                (thisMatch[k][l] === 1 &&
                  thisMatch[k + 2][l] === 1 &&
                  thisMatch[k + 1][l + 2] === 1) ||
                (thisMatch[k][l + 2] === 1 &&
                  thisMatch[k + 2][l + 2] === 1 &&
                  thisMatch[k + 1][l] === 1)
              ) {
                matchStyle = MatchStyle.T;
              }
            }
          }
        } else {
          // Row check
          for (var k = 0; k < _rows; ++k) {
            if (thisMatch[k].every((x) => x == 1)) {
              matchStyle = MatchStyle.Row;
              break;
            }
          }
        }
        matches.push(_makeMatch(cur_orb, count, matchStyle));
      }
    }
    return { matches: matches, board: match_board };
  };
  var _inPlaceRemoveMatches = function (board, match_board) {
    for (var i = 0; i < _rows; ++i) {
      for (var j = 0; j < _cols; ++j) {
        if (typeof match_board[i][j] != "undefined") {
          board[i][j] = "X";
        }
      }
    }
    return board;
  };
  var _inPlaceDropEmptySpaces = function (board) {
    for (var j = 0; j < _cols; ++j) {
      var dest_i = _rows - 1;
      for (var src_i = _rows - 1; src_i >= 0; --src_i) {
        if (board[src_i][j] != "X") {
          board[dest_i][j] = board[src_i][j];
          --dest_i;
        }
      }
      for (; dest_i >= 0; --dest_i) {
        board[dest_i][j] = "X";
      }
    }
    return board;
  };
  var _inPlaceEvaluateSolution = function (solution, weights) {
    var current_board = _copyBoard(solution.board);
    var all_matches = [];
    var drop_times = 0;
    while (true) {
      var matches = _findMatches(current_board);
      if (matches.matches.length == 0) {
        break;
      }
      _inPlaceRemoveMatches(current_board, matches.board);
      _inPlaceDropEmptySpaces(current_board);
      all_matches = all_matches.concat(matches.matches);
      drop_times += 1;
    }
    solution.drop_times = drop_times;
    solution.weight = _computeWeight(all_matches, weights);
    solution.mult = _computeMult(solution.board);
    solution.matches = all_matches;
    return current_board;
  };
  var _computeWeight = function (matches, weights) {
    var total_weight = 0;
    //find num rows.
    var numRows = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // MANUAL_UPDATE_TYPE
    matches.forEach(function (m) {
      if (m.isRow) {
        numRows[m.type]++;
      }
    });
    matches.forEach(function (m) {
      var base_weight = weights[m.type][m.count >= 5 ? "mass" : "normal"];
      if (m.matchStyle != MatchStyle.None) {
        base_weight += weights[m.type][m.matchStyle];
      }
      var multi_orb_bonus = (m.count - 3) * MULTI_ORB_BONUS + 1;
      total_weight +=
        multi_orb_bonus *
        base_weight *
        (1 + (numRows[m.type] * weights[m.type]["row"]) / 10);
    });
    var combo_bonus = (matches.length - 1) * COMBO_BONUS + 1;
    return total_weight * combo_bonus;
  };
  var _getSimplePathXYs = function (solution) {
    if (solution.simplyXYs) {
      return solution.simplyXYs; //solved already
    }
    var init_rc = solution.init_cursor;
    var path = solution.path;
    var rc = new Coordinate(init_rc.row, init_rc.col);
    var xys = [rc.getXY()];
    path.forEach(function (p) {
      _inPlaceMoveRC(rc, p);
      xys.push(rc.getXY());
    });
    return _simplifyPath(xys);
  };
  var _simplifyPath = function (xys) {
    // 1. Remove intermediate points.
    var simplified_xys = [xys[0]];
    var xys_length_1 = xys.length - 1;
    for (var i = 1; i < xys_length_1; ++i) {
      var dx0 = xys[i].x - xys[i - 1].x;
      var dx1 = xys[i + 1].x - xys[i].x;
      if (dx0 == dx1) {
        var dy0 = xys[i].y - xys[i - 1].y;
        var dy1 = xys[i + 1].y - xys[i].y;
        if (dy0 == dy1) {
          continue;
        }
      }
      simplified_xys.push(xys[i]);
    }
    simplified_xys.push(xys[xys_length_1]);
    return simplified_xys;
  };
  var _inPlaceMoveRC = function (rc, dir) {
    switch (dir) {
      case 0:
        rc.col += 1;
        break;
      case 1:
        rc.row += 1;
        rc.col += 1;
        break;
      case 2:
        rc.row += 1;
        break;
      case 3:
        rc.row += 1;
        rc.col -= 1;
        break;
      case 4:
        rc.col -= 1;
        break;
      case 5:
        rc.row -= 1;
        rc.col -= 1;
        break;
      case 6:
        rc.row -= 1;
        break;
      case 7:
        rc.row -= 1;
        rc.col += 1;
        break;
    }
  };
  var _getMaxPathLength = function () {
    _max_solutions_count = _rows * _cols * _max_path;
    return _max_length; // pay attaction, this is from optimizer.js (old version), yea a bit strange...
  };
  var _solveBoardStep = function (solve_state) {
    if (solve_state.p >= solve_state.max_length) {
      // finish
      _sortSolutions(solve_state.solutions); // inPlaceSorting: https://github.com/izenn/padopt/commit/53545c2d30c54f49d1293496e554c5ce968697f6#diff-4fb221052027124c5c17ffaf1a48572fR859
      _unsimplified_solutions = solve_state.solutions;
      _solutions = _simplifySolutions(solve_state.solutions);
      _current_solutions_max_length = solve_state.max_length;
      // callback
      if (typeof solve_state.finishCallback === "function") {
        solve_state.finishCallback(_solutions);
      }
      return;
    }

    ++solve_state.p;
    solve_state.solutions = _evolveSolutions(
      solve_state.solutions,
      solve_state.weights,
      solve_state.dir_step,
    );
    if (typeof solve_state.stepCallback === "function") {
      solve_state.stepCallback(solve_state.p, solve_state.max_length);
    }

    setTimeout(function () {
      _solveBoardStep(solve_state);
    }, 0); // TODO: what is this? maybe should use web worker?
  };
  var _evolveSolutions = function (solutions, weights, dir_step) {
    var new_solutions = [];
    solutions.forEach(function (s) {
      if (s.is_done) {
        return;
      }
      for (var dir = 0; dir < 8; dir += dir_step) {
        if (!_canMoveOrbInSolution(s, dir)) {
          continue;
        }
        var solution = _copySolution(s);
        _inPlaceSwapOrbInSolution(solution, dir);
        _inPlaceEvaluateSolution(solution, weights);
        new_solutions.push(solution);
      }
      s.is_done = true;
    });
    solutions = solutions.concat(new_solutions);
    // solutions.sort(function(a, b) {
    //   if (_sorting == "multiplier" ) {
    //     return b.mult - a.mult  ||  a.complexity - b.complexity || b.weight - a.weight;
    //   } else if (_sorting == "multiweight") {
    //     return b.mult - a.mult  || b.weight - a.weight ||  a.complexity - b.complexity;
    //   } else if (_sorting == "complexity") {
    //     return b.weight - a.weight || a.complexity - b.complexity;
    //   } else if (_sorting == "length") {
    //     return b.weight - a.weight || a.path.length - b.path.length;
    //   }
    // });
    // https://github.com/izenn/padopt/commit/53545c2d30c54f49d1293496e554c5ce968697f6
    solutions.sort(function (a, b) {
      return b.weight - a.weight;
    });
    return solutions.slice(0, _max_solutions_count);
  };
  var _sortSolutions = function (solutions) {
    solutions.sort(function (a, b) {
      if (_sorting == "multiplier") {
        return (
          b.mult - a.mult || a.complexity - b.complexity || b.weight - a.weight
        );
      } else if (_sorting == "mctwx") {
        return (
          b.mult - a.mult ||
          b.matches.length - a.matches.length ||
          a.drop_times - b.drop_times ||
          b.weight - a.weight ||
          a.complexity - b.complexity
        );
      } else if (_sorting == "mcwx") {
        return (
          b.mult - a.mult ||
          b.matches.length - a.matches.length ||
          b.weight - a.weight ||
          a.complexity - b.complexity
        );
      } else if (_sorting == "multiweight") {
        return (
          b.mult - a.mult || b.weight - a.weight || a.complexity - b.complexity
        );
      } else if (_sorting == "complexity") {
        return b.weight - a.weight || a.complexity - b.complexity;
      } else if (_sorting == "length") {
        return b.weight - a.weight || a.path.length - b.path.length;
      } else if (_sorting == "ctxl") {
        return (
          b.matches.length - a.matches.length ||
          b.drop_times - a.drop_times ||
          a.complexity - b.complexity ||
          a.path.length - b.path.length
        );
      }
    });
  };
  var _canMoveOrbInSolution = function (solution, dir) {
    // Don't allow going back directly. It's pointless.
    if (solution.path[solution.path.length - 1] == (dir + 4) % 8) {
      return false;
    }
    return _canMoveOrb(solution.cursor, dir);
  };
  var _canMoveOrb = function (rc, dir) {
    switch (dir) {
      case 0:
        return rc.col < _cols - 1;
      case 1:
        return rc.row < _rows - 1 && rc.col < _cols - 1;
      case 2:
        return rc.row < _rows - 1;
      case 3:
        return rc.row < _rows - 1 && rc.col > 0;
      case 4:
        return rc.col > 0;
      case 5:
        return rc.row > 0 && rc.col > 0;
      case 6:
        return rc.row > 0;
      case 7:
        return rc.row > 0 && rc.col < _cols - 1;
    }
    return false;
  };
  var _inPlaceSwapOrbInSolution = function (solution, dir) {
    var res = _inPlaceSwapOrb(solution.board, solution.cursor, dir);
    solution.cursor = res.rc;
    solution.path.push(dir);
  };
  var _inPlaceSwapOrb = function (board, rc, dir) {
    var old_rc = _copyRC(rc);
    _inPlaceMoveRC(rc, dir);
    var orig_type = board[old_rc.row][old_rc.col];
    board[old_rc.row][old_rc.col] = board[rc.row][rc.col];
    board[rc.row][rc.col] = orig_type;
    return { board: board, rc: rc };
  };
  var _simplifySolutions = function (solutions) {
    var simplified_solutions = [];
    solutions.forEach(function (solution) {
      for (var s = simplified_solutions.length - 1; s >= 0; --s) {
        var simplified_solution = simplified_solutions[s];
        if (!_equalsRC(simplified_solution.init_cursor, solution.init_cursor)) {
          continue;
        }
        if (!_equalsMatches(simplified_solution.matches, solution.matches)) {
          continue;
        }
        return;
      }
      simplified_solutions.push(solution);
    });
    return simplified_solutions;
  };

  // monitor

  // public methods
  return {
    changeMaxLength: function (new_max_length) {
      _max_length = new_max_length;
    },
    change8dirMovement: function (is_8_dir_movement) {
      _is_8_dir_movement_supported = is_8_dir_movement;
    },
    changeGrid: function (new_grid) {
      var tmp = new_grid.split("x");
      _rows = parseInt(tmp[1]);
      _cols = parseInt(tmp[0]);
    },
    changeSorting: function (new_sorting) {
      _sorting = new_sorting;
      // re-sort existing solutions
      _sortSolutions(_unsimplified_solutions); // inPlaceSorting: https://github.com/izenn/padopt/commit/53545c2d30c54f49d1293496e554c5ce968697f6#diff-4fb221052027124c5c17ffaf1a48572fR859
      _solutions = _simplifySolutions(_unsimplified_solutions);
      return _solutions;
    },
    changeMaxPath: function (new_max_path) {
      _max_path = new_max_path;
    },
    solveBoard: function (board_data, stepCallback, finishCallback) {
      // reset everything (such as solutions and other variables)
      _solutions = [];
      _unsimplified_solutions = [];
      _board = _initBoard();
      // convert board_data (board.js format) to optimizer format, and store in _board.
      var t_index = 0;
      for (var y = 0; y < _rows; y++) {
        for (var x = 0; x < _cols; x++) {
          _board[y][x] = board_data[t_index];
          t_index++;
        }
      }
      var solutions = new Array(_rows * _cols);
      var weights = _weights;

      var seed_solution = _makeSeedSolution(_board);
      _inPlaceEvaluateSolution(seed_solution, weights);

      for (var i = 0, s = 0; i < _rows; ++i) {
        for (var j = 0; j < _cols; ++j, ++s) {
          solutions[s] = _copySolutionWithCursor(seed_solution, i, j);
        }
      }
      var solve_state = {
        stepCallback: stepCallback,
        finishCallback: finishCallback,
        max_length: _getMaxPathLength(),
        dir_step: _is_8_dir_movement_supported ? 1 : 2,
        p: 0,
        solutions: solutions,
        weights: weights,
      };
      _solveBoardStep(solve_state);
    },
    getSolution: function (index) {
      var solution = _solutions[index];
      console.log(solution);
      solution.init_board = _board;
      return solution;
    },
    exportSolutionDropMatchesBoard: function (index) {
      var solution = _solutions[index];
      var drop_matches_board = _inPlaceEvaluateSolution(solution, _weights);
      return [].concat.apply([], drop_matches_board).join("");
    },
    lengthenSolution: function (stepCallback, finishCallback) {
      var board = _board;
      var solutions = _unsimplified_solutions;
      var weights = _weights;
      var seed_solution = _makeSeedSolution(board);
      _inPlaceEvaluateSolution(seed_solution, weights);
      for (var i = 0, s = 0; i < _rows; ++i) {
        for (var j = 0; j < _cols; ++j, ++s) {
          solutions.push(_copySolutionWithCursor(seed_solution, i, j));
        }
      }

      var new_max_path = _current_solutions_max_length + 1;

      var solve_state = {
        stepCallback: stepCallback,
        finishCallback: finishCallback,
        max_length: new_max_path,
        dir_step: _is_8_dir_movement_supported ? 1 : 2,
        p: _current_solutions_max_length,
        solutions: solutions,
        weights: weights,
      };

      _solveBoardStep(solve_state);

      return new_max_path;
    },
    setMultipleFormula: function (new_multiple_formula) {
      _multiple_formula = new_multiple_formula;
    },
    setWeights: function (new_weights) {
      _weights = new_weights;
    },
  };
}
