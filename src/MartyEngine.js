function MartyEngine(){
    var chess = {};

    chess.const = {};
    chess.const.typetoPiece = {
        p: 'pawn',
        n: 'knight',
        b: 'bishop',
        r: 'rook',
        q: 'queen',
        k: 'king'
    };
    chess.const.numtoPiece = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

    chess.const.color = {};
    chess.const.color.black = 0x08;
    chess.const.color.white = 0x10;

    chess.piece = {};
    chess.piece.pawn = 0x01;
    chess.piece.knight = 0x02;
    chess.piece.bishop = 0x03;
    chess.piece.rook = 0x04;
    chess.piece.queen = 0x05;
    chess.piece.king = 0x06;

    chess.piece.pieces = {};
    for(let index = 0; index < 2; index++){
        chess.piece.pieces[index == 0 ? 1 : 0] = {};
        for(let i = 0; i < 6; i++){
            var piece = index == 0 ? chess.const.color.white : chess.const.color.black;
            piece |= chess.piece[chess.const.numtoPiece[i]];
            chess.piece.pieces[index == 0 ? 1 : 0][chess.const.numtoPiece[i]] = piece;
        }
    }

    chess.piece.numpieces = {};
    for(let index = 0; index < 2; index++){
        for(let i = 0; i < 6; i++){
            var piece = index == 0 ? chess.const.color.white : chess.const.color.black;
            piece |= chess.piece[chess.const.numtoPiece[i]];
            chess.piece.numpieces[piece] = {color: index == 0 ? 1 : 0, type: chess.const.numtoPiece[i], num: piece};
        }
    }

    chess.move = {};

    chess.move.flagPassing = 0x02 << 16;

    chess.move.flagCastleKing = 0x04 << 16;
    chess.move.flagCastleQueen = 0x08 << 16;
    chess.move.flagPromotion = 0xf0 << 16;
    chess.move.flagPromoteQueen = 0x10 << 16;
    chess.move.flagPromoteRook = 0x20 << 16;
    chess.move.flagPromoteBishop = 0x40 << 16;
    chess.move.flagPromoteKnight = 0x80 << 16;

    chess.move.maskCastle = chess.move.flagCastleKing | chess.move.flagCastleQueen;
    chess.move.maskColor = chess.const.color.black | chess.const.color.white;

    chess.game = {};

    chess.game.countMove = 0;
    chess.game.captured = 0;
    chess.game.baseEval = 0;
    chess.game.castleRights = 0xf;
    chess.game.passing = 65;
    chess.game.move50 = 0;
    chess.game.moveNumber = 0;
    chess.game.inCheck = false;
    chess.game.lastCastle = 0;
    chess.game.phase = 32;
    chess.game.board = new Array(65);
    chess.game.pieceIndex = new Array(256);
    chess.game.pieceList = new Array(2 * 8 * 16);
    chess.game.pieceCount = new Array(2 * 8);
    chess.game.destiny = new Array(8);

    chess.game.undoStack = [];
    chess.game.undoIndex = 0;
    chess.game.whiteTurn = 1;
    chess.game.colorEnemy = chess.const.color.black;
    chess.game.colorUs = chess.const.color.white;

    chess.game.move = undefined;

    boardCastle = [
        7, 15, 15, 15, 3, 15, 15, 11,
        15, 15, 15, 15, 15, 15, 15, 15,
        15, 15, 15, 15, 15, 15, 15, 15,
        15, 15, 15, 15, 15, 15, 15, 15,
        15, 15, 15, 15, 15, 15, 15, 15,
        15, 15, 15, 15, 15, 15, 15, 15,
        15, 15, 15, 15, 15, 15, 15, 15,
        13, 15, 15, 15, 12, 15, 15, 14];
    boardCheck = [
        0, 0, 0, chess.const.color.black | chess.move.flagCastleQueen, chess.const.color.black | chess.move.maskCastle, chess.const.color.black | chess.move.flagCastleKing, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, chess.const.color.white | chess.move.flagCastleQueen, chess.const.color.white | chess.move.maskCastle, chess.const.color.white | chess.move.flagCastleKing, 0, 0];
    boardOutpost = [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x10,
        0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18,
        0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18,
        0x08, 0x08, 0x08, 0x08, 0x08, 0x08, 0x08, 0x08,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0];
    var adjOutpost = [0, 8, 32, 16, 4, 2, 0];
    var tmpCenter = [[4, 2], [8, 8], [4, 8], [-8, 8], [8, 0xf], [-8, 8]];
    var tmpMaterial = [[171, 240], [764, 848], [826, 891], [1282, 1373], [2526, 2646], [0xffff, 0xffff]];
    var tmpPassed = [[5, 7], [5, 14], [31, 38], [73, 73], [166, 166], [252, 252]];
    var tmpMobility = [[],
    [[-75, -76], [-57, -54], [-9, -28], [-2, -10], [6, 5], [14, 12], [22, 26], [29, 29], [36, 29]],//knight
    [[-48, -59], [-20, -23], [16, -3], [26, 13], [38, 24], [51, 42], [55, 54], [63, 57], [63, 65], [68, 73], [81, 78], [81, 86], [91, 88], [98, 97]],//bishop
    [[-58, -76], [-27, -18], [-15, 28], [-10, 55], [-5, 69], [-2, 82], [9, 112], [16, 118], [30, 132], [29, 142], [32, 155], [38, 165], [46, 166], [48, 169], [58, 171]],//rook
    [[-39, -36], [-21, -15], [3, 8], [3, 18], [14, 34], [22, 54], [28, 61], [41, 73], [43, 79], [48, 92], [56, 94], [60, 104], [60, 113], [66, 120], [67, 123], [70, 126], [71, 133], [73, 136], [79, 140], [88, 143], [88, 148], [99, 166], [102, 170], [102, 175], [106, 184], [109, 191], [113, 206], [116, 212]],//queen
    [[90, 9], [80, 8], [70, 7], [60, 6], [50, 5], [40, 4], [30, 3], [20, 2], [10, 1]]];//king
    var arrMobility = [];
    var adjMobility = 0;
    var pieceValue = [];
    var optCenter = 0;


    function StrToSquare(s) {
        var f = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
        var x = f[s.charAt(0)];
        var y = 8 - parseInt(s.charAt(1));
        return (y << 3) | x;
    }

    function FormatSquare(s) {
        return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][s & 0x7] + (8 - (s >> 3));
    }

    function FormatPromotion(move){
        var result = '';
        if (move & chess.move.flagPromotion) {
            if (move & chess.move.flagPromoteQueen) result += 'q';
            else if (move & chess.move.flagPromoteRook) result += 'r';
            else if (move & chess.move.flagPromoteBishop) result += 'b';
            else result += 'n';
        }
        return result;
    }

    function FormatMoveArr(move){
        return {from:FormatSquare(((move & 0xFF) >> 3) * 8 + ((move & 0xFF) & 0x7)),to:FormatSquare((((move >> 8) & 0xFF) >> 3) * 8 + (((move >> 8) & 0xFF) & 0x7)), promotion:FormatPromotion(move)};
    }

    function FormatMove(move) {
        var result = FormatSquare(move & 0xFF) + FormatSquare((move >> 8) & 0xFF);
        result += FormatPromotion(move);
        return result;
    }

    function GetMoveFromString(s) {
        var moves = GenerateAllMoves(chess.game.whiteTurn, false);
        for (var i = 0; i < moves.length; i++)
            if (FormatMove(moves[i]) == s)
                return moves[i];
        return chess.game.move;
    }

    function Initialize() {
        for (var n = 0; n < 8; n++)
            chess.game.destiny[n] = new Array(64);
        for (var p = 0; p < 6; p++) {
            arrMobility[p] = [];
            for (var ph = 2; ph < 33; ph++) {
                var f = (ph - 2) / 32;
                arrMobility[p][ph] = [];
                for (var m = 0; m < tmpMobility[p].length; m++) {
                    var a = tmpMobility[p][m][0];
                    var b = tmpMobility[p][m][1];
                    var v = Math.floor(a * f + b * (1 - f));
                    arrMobility[p][ph][m] = v;
                }
            }
        }
        for (var ph = 2; ph < 33; ph++) {
            pieceValue[ph] = [];
            for (var p = 0; p < 16; p++)
                pieceValue[ph][p] = new Array(64);
        }
        for (var n = 0; n < 64; n++) {
            var x = n & 7;
            var y = n >> 3;
            var nb = ((7 - y) << 3) + x;
            var cx = Math.min(x, 7 - x) + 1;
            var cy = Math.min(y, 7 - y) + 1;
            var center = (cx * cy) - 1;
            if (y > 0 && y < 7) {
                GeneratePwnDestiny(0, n, x, y, 1);//pawn black
                GeneratePwnDestiny(1, n, x, y, -1);//pawn white
            }
            GenerateShrDestiny(2, n, x, y, [{ x: 2, y: -1 }, { x: 2, y: 1 }, { x: -2, y: -1 }, { x: -2, y: 1 }, { x: -1, y: 2 }, { x: 1, y: 2 }, { x: -1, y: -2 }, { x: 1, y: -2 }]);//knight
            GenerateShrDestiny(6, n, x, y, [{ x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]);//king
            GenerateStdDestiny(3, n, x, y, [{ x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }]);//bishop
            GenerateStdDestiny(4, n, x, y, [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]);//rook
            GenerateStdDestiny(5, n, x, y, [{ x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]);//queen		
            for (var ph = 2; ph < 33; ph++) {
                var f = ph / 32;
                for (var p = 1; p < 7; p++) {
                    var v = Math.floor(tmpMaterial[p - 1][0] * f + tmpMaterial[p - 1][1] * (1 - f));
                    var a = tmpCenter[p - 1][0];
                    var b = tmpCenter[p - 1][1];
                    a = optCenter > 0 ? a << optCenter : a >> optCenter;
                    b = optCenter > 0 ? b << optCenter : b >> optCenter;
                    v += Math.floor((a * f + b * (1 - f)) * center);
                    if (p == 1 && y > 0 && y < 7) {
                        var py = 6 - y;
                        a = tmpPassed[py][0];
                        b = tmpPassed[py][1];
                        v += Math.floor(a * f + b * (1 - f));
                    }
                    pieceValue[ph][p][n] = v;
                    pieceValue[ph][p | 8][nb] = v;
                }
            }
        }
    }

    function undos(){
        return {captured: chess.game.captured, passing: chess.game.passing, castle: chess.game.castleRights, move50: chess.game.move50, value: chess.game.baseEval, lastCastle: chess.game.lastCastle};
    }

    function InitializeFromFen(fen) {
        movesIndex = 0;
        for (var n = 0; n < 65; n++)
            chess.game.board[n] = 0;
        chess.game.phase = 0;
        if (!fen) fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        var chunks = fen.split(' ');
        var x = 0;
        var y = 0;
        var pieces = chunks[0];
        for (var i = 0; i < pieces.length; i++) {
            var c = pieces.charAt(i);
            if (c == '/') {
                y++;
                x = 0;
            } else if (c >= '0' && c <= '9') {
                for (var j = 0; j < parseInt(c); j++)
                    x++;
            } else {
                chess.game.phase++;
                var b = c.toLowerCase();
                var piece = b == c ? chess.const.color.black : chess.const.color.white;
                var index = (y << 3) + x;
                piece |= chess.piece[chess.const.typetoPiece[b]];
                chess.game.board[index] = piece;
                x++;
            }
        }
        chess.game.whiteTurn = (chunks[1].charAt(0) == 'w') | 0;
        chess.game.castleRights = 0;
        if (chunks[2].indexOf('K') != -1)
            chess.game.castleRights |= 1;
        if (chunks[2].indexOf('Q') != -1)
            chess.game.castleRights |= 2;
        if (chunks[2].indexOf('k') != -1)
            chess.game.castleRights |= 4;
        if (chunks[2].indexOf('q') != -1)
            chess.game.castleRights |= 8;
        chess.game.passing = 65;
        if (chunks[3].indexOf('-') == -1)
            chess.game.passing = StrToSquare(chunks[3]);
        chess.game.move50 = parseInt(chunks[4]);
        chess.game.moveNumber = parseInt(chunks[5]);
        if (chess.game.moveNumber) chess.game.moveNumber--;
        chess.game.moveNumber *= 2;
        if (!chess.game.whiteTurn) chess.game.moveNumber++;
        chess.game.undoStack = [];
        for (chess.game.undoIndex = 0; chess.game.undoIndex <= chess.game.moveNumber; chess.game.undoIndex++)
            chess.game.undoStack[chess.game.undoIndex] = undos();
        InitializePieceList();
    }

    function InitializePieceList() {
        chess.game.baseEval = 0;
        for (var i = 0; i < 16; i++) {
            chess.game.pieceCount[i] = 0;
            for (var j = 0; j < 16; j++)
                chess.game.pieceList[(i << 4) | j] = 65;
        }
        for (var i = 0; i < 64; i++) {
            chess.game.pieceIndex[i] = 0;
            var piece = chess.game.board[i] & 0xF;
            if (piece) {
                chess.game.pieceList[(piece << 4) | chess.game.pieceCount[piece]] = i;
                chess.game.pieceIndex[i] = chess.game.pieceCount[piece];
                chess.game.pieceCount[piece]++;
                var v = pieceValue[chess.game.phase][piece][i];
                chess.game.baseEval += piece & chess.const.color.black ? -v : v;
            }
        }
        if (!chess.game.whiteTurn) chess.game.baseEval = -chess.game.baseEval;
    }

    var countNA = 0;

    function GenerateMove(moves, fr, to, add, flag) {
        chess.game.countMove++;
        var p = chess.game.board[to] & 7;
        if ((p == chess.piece.king) || ((chess.game.lastCastle & chess.move.maskCastle) && ((boardCheck[to] & chess.game.lastCastle) == chess.game.lastCastle)))
            chess.game.inCheck = true;
        else if (add) {
            var m = fr | (to << 8) | flag;
            if (flag == chess.move.flagPassing) p = 1;
            if (p)
                moves[moves.length] = m;
            else {
                moves[moves.length] = moves[countNA];
                moves[countNA++] = m;
            }
        }
    }

    function GenerateMovePwn(moves, fr, to, add, flag) {
        if ((to < 8 || to > 55) && add) {
            GenerateMove(moves, fr, to, add, chess.move.flagPromoteQueen);
            GenerateMove(moves, fr, to, add, chess.move.flagPromoteRook);
            GenerateMove(moves, fr, to, add, chess.move.flagPromoteBishop);
            GenerateMove(moves, fr, to, add, chess.move.flagPromoteKnight);
        } else
            GenerateMove(moves, fr, to, add, flag);
    }

    function GenerateAllMoves(attack) {
        chess.game.inCheck = false;
        adjMobility = 0;
        countNA = 0;
        chess.game.colorEnemy = chess.game.whiteTurn ? chess.const.color.black : chess.const.color.white;
        chess.game.colorUs = chess.game.whiteTurn ? chess.const.color.white : chess.const.color.black;
        var pieceM = 0;
        var pieceN = 0;
        var pieceB = 0;
        var moves = [];
        var color = chess.game.whiteTurn ? 0 : 8;
        var pieceIdx = (color | 1) << 4;
        var fr = chess.game.pieceList[pieceIdx++];
        var col = 0;
        while (chess.game.board[fr]) {
            pieceM++;
            GeneratePwnMoves(moves, attack, fr, chess.game.destiny[chess.game.whiteTurn][fr]);
            if (chess.game.inCheck) return [];
            var x = 1 << (fr & 7);
            if (col & x) adjMobility -= 16;
            col |= x;
            fr = chess.game.pieceList[pieceIdx++];
        }
        if ((col & 0xc0) == 0x80) adjMobility -= 32;
        if ((col & 0xe0) == 0x40) adjMobility -= 32;
        if ((col & 0x70) == 0x20) adjMobility -= 32;
        if ((col & 0x38) == 0x10) adjMobility -= 32;
        if ((col & 0x1c) == 0x08) adjMobility -= 32;
        if ((col & 0x0e) == 0x04) adjMobility -= 32;
        if ((col & 0x07) == 0x02) adjMobility -= 32;
        if ((col & 0x03) == 0x01) adjMobility -= 32;
        pieceIdx = (color | chess.piece.knight) << 4;
        fr = chess.game.pieceList[pieceIdx++];
        while (chess.game.board[fr]) {
            pieceN++;
            chess.game.countMove = 0;
            GenerateShrMoves(moves, attack, fr, chess.game.destiny[2][fr]);
            if (chess.game.inCheck) return [];
            adjMobility += arrMobility[1][chess.game.phase][chess.game.countMove];
            fr = chess.game.pieceList[pieceIdx++];
        }
        pieceIdx = (color | chess.piece.bishop) << 4;
        fr = chess.game.pieceList[pieceIdx++];
        while (chess.game.board[fr]) {
            pieceB++;
            chess.game.countMove = 0;
            GenerateStdMoves(moves, attack, fr, chess.game.destiny[3][fr]);
            if (chess.game.inCheck) return [];
            adjMobility += arrMobility[2][chess.game.phase][chess.game.countMove];
            fr = chess.game.pieceList[pieceIdx++];
        }
        pieceIdx = (color | 4) << 4;
        fr = chess.game.pieceList[pieceIdx++];
        while (chess.game.board[fr]) {
            pieceM++;
            chess.game.countMove = 0;
            GenerateStdMoves(moves, attack, fr, chess.game.destiny[4][fr]);
            if (chess.game.inCheck) return [];
            adjMobility += arrMobility[3][chess.game.phase][chess.game.countMove];
            fr = chess.game.pieceList[pieceIdx++];
        }
        pieceIdx = (color | 5) << 4;
        fr = chess.game.pieceList[pieceIdx++];
        while (chess.game.board[fr]) {
            pieceM++;
            chess.game.countMove = 0;
            GenerateStdMoves(moves, attack, fr, chess.game.destiny[5][fr]);
            if (chess.game.inCheck) return [];
            adjMobility += arrMobility[4][chess.game.phase][chess.game.countMove];
            fr = chess.game.pieceList[pieceIdx++];
        }
        pieceIdx = (color | 6) << 4;
        fr = chess.game.pieceList[pieceIdx++];
        while (chess.game.board[fr]) {
            chess.game.countMove = 0;
            GenerateShrMoves(moves, attack, fr, chess.game.destiny[6][fr]);
            if (chess.game.inCheck) return [];
            var cr = chess.game.whiteTurn ? chess.game.castleRights : chess.game.castleRights >> 2;
            if (cr & 1)
                if ((!chess.game.board[fr + 1]) && (!chess.game.board[fr + 2]))
                    GenerateMove(moves, fr, fr + 2, !attack, chess.move.flagCastleKing);
            if (cr & 2)
                if ((!chess.game.board[fr - 1]) && (!chess.game.board[fr - 2]) && (!chess.game.board[fr - 3]))
                    GenerateMove(moves, fr, fr - 2, !attack, chess.move.flagCastleQueen);
            adjMobility += arrMobility[5][chess.game.phase][chess.game.countMove];
            fr = chess.game.pieceList[pieceIdx++];
        }
        adjInsufficient = (!pieceM) && (pieceN + (pieceB << 1) < 3);
        if (pieceB > 1)
            adjMobility += 64;
        return moves;
    }

    function GeneratePwnDestiny(piece, fr, x, y, dy) {
        chess.game.destiny[piece][fr] = [[], []];
        var to = ((y + dy) << 3) + x;
        chess.game.destiny[piece][fr][0].push(to);
        if ((y == 1) && (dy == 1))
            chess.game.destiny[piece][fr][0].unshift(to + 8);
        if ((y == 6) && (dy == -1))
            chess.game.destiny[piece][fr][0].unshift(to - 8);
        if (x < 7)
            chess.game.destiny[piece][fr][1].push(to + 1);
        if (x > 0)
            chess.game.destiny[piece][fr][1].push(to - 1);
    }

    function GeneratePwnMoves(moves, attack, fr, des) {
        var n = des[0].length;
        while (n--) {
            var to = des[0][n];
            if (!chess.game.board[to])
                GenerateMovePwn(moves, fr, to, !attack);
            else
                break;
        }
        var n = des[1].length;
        while (n--) {
            var to = des[1][n];
            if (chess.game.board[to] & chess.game.colorEnemy)
                GenerateMovePwn(moves, fr, to, true);
            if ((chess.game.board[to] & chess.game.colorUs) && (boardOutpost[to] & chess.game.colorUs)) {
                adjMobility += adjOutpost[chess.game.board[to] & 7];
            } else if (to == chess.game.passing)
                GenerateMove(moves, fr, to, true, chess.move.flagPassing);
            else if ((chess.game.lastCastle & chess.move.maskCastle) && ((boardCheck[to] & chess.game.lastCastle) == chess.game.lastCastle))
                chess.game.inCheck = true;
        }
    }

    function GenerateShrDestiny(piece, fr, x, y, dir) {
        chess.game.destiny[piece][fr] = [];
        for (var n = 0; n < dir.length; n++) {
            var d = dir[n];
            var cx = x + d.x;
            var cy = y + d.y;
            if (cx < 0 || cy < 0 || cx > 7 || cy > 7) continue;
            var to = (cy << 3) + cx;
            chess.game.destiny[piece][fr].push(to);
        }
    }

    function GenerateShrMoves(moves, attack, fr, des) {
        var n = des.length;
        while (n--) {
            var to = des[n];
            if (chess.game.board[to] & chess.game.colorEnemy)
                GenerateMove(moves, fr, to, true);
            else if (!chess.game.board[to])
                GenerateMove(moves, fr, to, !attack);
        }
    }

    function GenerateStdDestiny(piece, fr, x, y, dir) {
        chess.game.destiny[piece][fr] = [];
        for (var n = 0; n < dir.length; n++) {
            var d = dir[n];
            var cx = x + d.x;
            var cy = y + d.y;
            var a = [];
            while ((cx >= 0) && (cy >= 0) && (cx <= 7) && (cy <= 7)) {
                var to = (cy << 3) + cx;
                a.unshift(to);
                cx += d.x;
                cy += d.y;
            }
            chess.game.destiny[piece][fr].push(a);
        }
    }

    function GenerateStdMoves(moves, attack, fr, des) {
        var n = des.length;
        while (n--) {
            var a = des[n];
            var d = a.length;
            while (d--) {
                var to = a[d];
                if (!chess.game.board[to])
                    GenerateMove(moves, fr, to, !attack);
                else {
                    if (chess.game.board[to] & chess.game.colorEnemy) {
                        GenerateMove(moves, fr, to, true);
                    }
                    break;
                }
            }
        }
    }

    function MakeMove(move) {
        var fr = move & 0xFF;
        var to = (move >> 8) & 0xFF;
        var flags = move & 0xFF0000;
        var piecefr = chess.game.board[fr];
        var piece = piecefr & 0xf;
        var capi = to;
        chess.game.captured = chess.game.board[to];
        chess.game.lastCastle = (move & chess.move.maskCastle) | (piecefr & chess.move.maskColor);
        if (flags & chess.move.flagCastleKing) {
            var rook = chess.game.board[to + 1];
            chess.game.board[to - 1] = rook;
            chess.game.board[to + 1] = 0;
            var rookIndex = chess.game.pieceIndex[to + 1];
            chess.game.pieceIndex[to - 1] = rookIndex;
            chess.game.pieceList[((rook & 0xF) << 4) | rookIndex] = to - 1;
        } else if (flags & chess.move.flagCastleQueen) {
            var rook = chess.game.board[to - 2];
            chess.game.board[to + 1] = rook;
            chess.game.board[to - 2] = 0;
            var rookIndex = chess.game.pieceIndex[to - 2];
            chess.game.pieceIndex[to + 1] = rookIndex;
            chess.game.pieceList[((rook & 0xF) << 4) | rookIndex] = to + 1;
        } else if (flags & chess.move.flagPassing) {
            capi = chess.game.whiteTurn ? to + 8 : to - 8;
            chess.game.captured = chess.game.board[capi];
            chess.game.board[capi] = 0;
        }
        chess.game.undoStack[chess.game.undoIndex++] = undos();
        chess.game.passing = 65;
        var capturedType = chess.game.captured & 0xF;
        if (capturedType) {
            chess.game.pieceCount[capturedType]--;
            var lastPieceSquare = chess.game.pieceList[(capturedType << 4) | chess.game.pieceCount[capturedType]];
            chess.game.pieceIndex[lastPieceSquare] = chess.game.pieceIndex[capi];
            chess.game.pieceList[(capturedType << 4) | chess.game.pieceIndex[lastPieceSquare]] = lastPieceSquare;
            chess.game.pieceList[(capturedType << 4) | chess.game.pieceCount[capturedType]] = 65;
            chess.game.baseEval += pieceValue[chess.game.phase][capturedType][to];
            chess.game.move50 = 0;
            chess.game.phase--;
        } else if ((piece & 7) == chess.piece.pawn) {
            if (to == (fr + 16)) chess.game.passing = (fr + 8);
            if (to == (fr - 16)) chess.game.passing = (fr - 8);
            chess.game.move50 = 0;
        } else
            chess.game.move50++;
        chess.game.pieceIndex[to] = chess.game.pieceIndex[fr];
        chess.game.pieceList[((piece) << 4) | chess.game.pieceIndex[to]] = to;
        if (flags & chess.move.flagPromotion) {
            var newPiece = piecefr & (~0x7);
            if (flags & chess.move.flagPromoteQueen)
                newPiece |= chess.piece.queen;
            else if (flags & chess.move.flagPromoteRook)
                newPiece |= chess.piece.rook;
            else if (flags & chess.move.flagPromoteBishop)
                newPiece |= chess.piece.bishop;
            else
                newPiece |= chess.piece.knight;
            chess.game.board[to] = newPiece;
            var promoteType = newPiece & 0xF;
            chess.game.pieceCount[piece]--;
            var lastPawnSquare = chess.game.pieceList[(piece << 4) | chess.game.pieceCount[piece]];
            chess.game.pieceIndex[lastPawnSquare] = chess.game.pieceIndex[to];
            chess.game.pieceList[(piece << 4) | chess.game.pieceIndex[lastPawnSquare]] = lastPawnSquare;
            chess.game.pieceList[(piece << 4) | chess.game.pieceCount[piece]] = 65;
            chess.game.pieceIndex[to] = chess.game.pieceCount[promoteType];
            chess.game.pieceList[(promoteType << 4) | chess.game.pieceIndex[to]] = to;
            chess.game.pieceCount[promoteType]++;
            chess.game.baseEval -= pieceValue[chess.game.phase][piece][fr];
            chess.game.baseEval += pieceValue[chess.game.phase][promoteType][to];
        } else {
            chess.game.board[to] = chess.game.board[fr];
            chess.game.baseEval -= pieceValue[chess.game.phase][piece][fr];
            chess.game.baseEval += pieceValue[chess.game.phase][piece][to];
        }
        chess.game.board[fr] = 0;
        chess.game.castleRights &= boardCastle[fr] & boardCastle[to];
        chess.game.baseEval = -chess.game.baseEval;
        chess.game.whiteTurn ^= 1;
        chess.game.moveNumber++;
        chess.game.move = move;
    }

    function UndoMove(move = chess.game.move) {
        var fr = move & 0xFF;
        var to = (move >> 8) & 0xFF;
        var flags = move & 0xFF0000;
        var piece = chess.game.board[to];
        var capi = to;
        var undo = chess.game.undoStack[--chess.game.undoIndex];
        chess.game.passing = undo.passing;
        chess.game.castleRights = undo.castle;
        chess.game.move50 = undo.move50;
        chess.game.baseEval = undo.value;
        chess.game.lastCastle = undo.lastCastle;
        var captured = undo.captured;
        if (flags & chess.move.flagCastleKing) {
            var rook = chess.game.board[to - 1];
            chess.game.board[to + 1] = rook;
            chess.game.board[to - 1] = 0;
            var rookIndex = chess.game.pieceIndex[to - 1];
            chess.game.pieceIndex[to + 1] = rookIndex;
            chess.game.pieceList[((rook & 0xF) << 4) | rookIndex] = to + 1;
        } else if (flags & chess.move.flagCastleQueen) {
            var rook = chess.game.board[to + 1];
            chess.game.board[to - 2] = rook;
            chess.game.board[to + 1] = 0;
            var rookIndex = chess.game.pieceIndex[to + 1];
            chess.game.pieceIndex[to - 2] = rookIndex;
            chess.game.pieceList[((rook & 0xF) << 4) | rookIndex] = to - 2;
        }
        if (flags & chess.move.flagPromotion) {
            piece = (chess.game.board[to] & (~0x7)) | chess.piece.pawn;
            chess.game.board[fr] = piece;
            var pawnType = chess.game.board[fr] & 0xF;
            var promoteType = chess.game.board[to] & 0xF;
            chess.game.pieceCount[promoteType]--;
            var lastPromoteSquare = chess.game.pieceList[(promoteType << 4) | chess.game.pieceCount[promoteType]];
            chess.game.pieceIndex[lastPromoteSquare] = chess.game.pieceIndex[to];
            chess.game.pieceList[(promoteType << 4) | chess.game.pieceIndex[lastPromoteSquare]] = lastPromoteSquare;
            chess.game.pieceList[(promoteType << 4) | chess.game.pieceCount[promoteType]] = 65;
            chess.game.pieceIndex[to] = chess.game.pieceCount[pawnType];
            chess.game.pieceList[(pawnType << 4) | chess.game.pieceIndex[to]] = to;
            chess.game.pieceCount[pawnType]++;
        } else chess.game.board[fr] = chess.game.board[to];
        if (flags & chess.move.flagPassing) {
            capi = chess.game.whiteTurn ? to - 8 : to + 8;
            chess.game.board[to] = 0;
        }
        chess.game.board[capi] = captured;
        chess.game.pieceIndex[fr] = chess.game.pieceIndex[to];
        chess.game.pieceList[((piece & 0xF) << 4) | chess.game.pieceIndex[fr]] = fr;
        var captureType = captured & 0xF;
        if (captureType) {
            chess.game.pieceIndex[capi] = chess.game.pieceCount[captureType];
            chess.game.pieceList[(captureType << 4) | chess.game.pieceCount[captureType]] = capi;
            chess.game.pieceCount[captureType]++;
            chess.game.phase++;
        }
        chess.game.whiteTurn ^= 1;
        chess.game.moveNumber--;
        chess.game.move = null;
    }
    function turn(){
        return chess.game.whiteTurn == 1 ? 'w' : 'b'
    }
    Initialize();
    InitializeFromFen();

    chess.engine = {};
    chess.engine.EvalPosition = function(){
        var PAWN = 0;
        var KNIGHT = 1;
        var BISHOP = 2;
        var ROOK = 3;
        var QUEEN = 4;
        var KING = 5;

        /* board representation */
        var WHITE = 0;
        var BLACK = 1;

        var WHITE_PAWN = (2*PAWN + WHITE);
        var BLACK_PAWN = (2*PAWN + BLACK);
        var WHITE_KNIGHT = (2*KNIGHT + WHITE);
        var BLACK_KNIGHT = (2*KNIGHT + BLACK);
        var WHITE_BISHOP = (2*BISHOP + WHITE);
        var BLACK_BISHOP = (2*BISHOP + BLACK);
        var WHITE_ROOK = (2*ROOK + WHITE);
        var BLACK_ROOK = (2*ROOK + BLACK);
        var WHITE_QUEEN = (2*QUEEN + WHITE);
        var BLACK_QUEEN = (2*QUEEN + BLACK);
        var WHITE_KING = (2*KING + WHITE);
        var BLACK_KING = (2*KING + BLACK);
        var EMPTY = PAWN;

        var numToEVAL = {
            9: BLACK_PAWN,
            10: BLACK_KNIGHT,
            11: BLACK_BISHOP,
            12: BLACK_ROOK,
            13: BLACK_QUEEN,
            14: BLACK_KING,
            17: WHITE_PAWN,
            18: WHITE_KNIGHT,
            19: WHITE_BISHOP,
            20: WHITE_ROOK,
            21: WHITE_QUEEN,
            22: WHITE_KING
        };

        function PCOLOR(p){
            return (p)&1;
        }

        function FLIP(sq){
            return ((sq)^56);
        }

        function OTHER(side){
            return ((side)^ 1);
        }

        var mg_value = [82, 337, 365, 477, 1025, 0];
        var eg_value = [94, 281, 297, 512,  936, 0];

        /* piece/sq tables */
        /* values from Rofchade: http://www.talkchess.com/forum3/viewtopic.php?f=2&t=68311&start=19 */

        var mg_pawn_table = [
            0,   0,   0,   0,   0,   0,  0,   0,
            98, 134,  61,  95,  68, 126, 34, -11,
            -6,   7,  26,  31,  65,  56, 25, -20,
            -14,  13,   6,  21,  23,  12, 17, -23,
            -27,  -2,  -5,  12,  17,   6, 10, -25,
            -26,  -4,  -4, -10,   3,   3, 33, -12,
            -35,  -1, -20, -23, -15,  24, 38, -22,
            0,   0,   0,   0,   0,   0,  0,   0,
        ];

        var eg_pawn_table = [
            0,   0,   0,   0,   0,   0,   0,   0,
            178, 173, 158, 134, 147, 132, 165, 187,
            94, 100,  85,  67,  56,  53,  82,  84,
            32,  24,  13,   5,  -2,   4,  17,  17,
            13,   9,  -3,  -7,  -7,  -8,   3,  -1,
            4,   7,  -6,   1,   0,  -5,  -1,  -8,
            13,   8,   8,  10,  13,   0,   2,  -7,
            0,   0,   0,   0,   0,   0,   0,   0,
        ];

        var mg_knight_table = [
            -167, -89, -34, -49,  61, -97, -15, -107,
            -73, -41,  72,  36,  23,  62,   7,  -17,
            -47,  60,  37,  65,  84, 129,  73,   44,
            -9,  17,  19,  53,  37,  69,  18,   22,
            -13,   4,  16,  13,  28,  19,  21,   -8,
            -23,  -9,  12,  10,  19,  17,  25,  -16,
            -29, -53, -12,  -3,  -1,  18, -14,  -19,
            -105, -21, -58, -33, -17, -28, -19,  -23,
        ];

        var eg_knight_table = [
            -58, -38, -13, -28, -31, -27, -63, -99,
            -25,  -8, -25,  -2,  -9, -25, -24, -52,
            -24, -20,  10,   9,  -1,  -9, -19, -41,
            -17,   3,  22,  22,  22,  11,   8, -18,
            -18,  -6,  16,  25,  16,  17,   4, -18,
            -23,  -3,  -1,  15,  10,  -3, -20, -22,
            -42, -20, -10,  -5,  -2, -20, -23, -44,
            -29, -51, -23, -15, -22, -18, -50, -64,
        ];

        var mg_bishop_table = [
            -29,   4, -82, -37, -25, -42,   7,  -8,
            -26,  16, -18, -13,  30,  59,  18, -47,
            -16,  37,  43,  40,  35,  50,  37,  -2,
            -4,   5,  19,  50,  37,  37,   7,  -2,
            -6,  13,  13,  26,  34,  12,  10,   4,
            0,  15,  15,  15,  14,  27,  18,  10,
            4,  15,  16,   0,   7,  21,  33,   1,
            -33,  -3, -14, -21, -13, -12, -39, -21,
        ];

        var eg_bishop_table = [
            -14, -21, -11,  -8, -7,  -9, -17, -24,
            -8,  -4,   7, -12, -3, -13,  -4, -14,
            2,  -8,   0,  -1, -2,   6,   0,   4,
            -3,   9,  12,   9, 14,  10,   3,   2,
            -6,   3,  13,  19,  7,  10,  -3,  -9,
            -12,  -3,   8,  10, 13,   3,  -7, -15,
            -14, -18,  -7,  -1,  4,  -9, -15, -27,
            -23,  -9, -23,  -5, -9, -16,  -5, -17,
        ];

        var mg_rook_table = [
            32,  42,  32,  51, 63,  9,  31,  43,
            27,  32,  58,  62, 80, 67,  26,  44,
            -5,  19,  26,  36, 17, 45,  61,  16,
            -24, -11,   7,  26, 24, 35,  -8, -20,
            -36, -26, -12,  -1,  9, -7,   6, -23,
            -45, -25, -16, -17,  3,  0,  -5, -33,
            -44, -16, -20,  -9, -1, 11,  -6, -71,
            -19, -13,   1,  17, 16,  7, -37, -26,
        ];

        var eg_rook_table = [
            13, 10, 18, 15, 12,  12,   8,   5,
            11, 13, 13, 11, -3,   3,   8,   3,
            7,  7,  7,  5,  4,  -3,  -5,  -3,
            4,  3, 13,  1,  2,   1,  -1,   2,
            3,  5,  8,  4, -5,  -6,  -8, -11,
            -4,  0, -5, -1, -7, -12,  -8, -16,
            -6, -6,  0,  2, -9,  -9, -11,  -3,
            -9,  2,  3, -1, -5, -13,   4, -20,
        ];

        var mg_queen_table = [
            -28,   0,  29,  12,  59,  44,  43,  45,
            -24, -39,  -5,   1, -16,  57,  28,  54,
            -13, -17,   7,   8,  29,  56,  47,  57,
            -27, -27, -16, -16,  -1,  17,  -2,   1,
            -9, -26,  -9, -10,  -2,  -4,   3,  -3,
            -14,   2, -11,  -2,  -5,   2,  14,   5,
            -35,  -8,  11,   2,   8,  15,  -3,   1,
            -1, -18,  -9,  10, -15, -25, -31, -50,
        ];

        var eg_queen_table = [
            -9,  22,  22,  27,  27,  19,  10,  20,
            -17,  20,  32,  41,  58,  25,  30,   0,
            -20,   6,   9,  49,  47,  35,  19,   9,
            3,  22,  24,  45,  57,  40,  57,  36,
            -18,  28,  19,  47,  31,  34,  39,  23,
            -16, -27,  15,   6,   9,  17,  10,   5,
            -22, -23, -30, -16, -16, -23, -36, -32,
            -33, -28, -22, -43,  -5, -32, -20, -41,
        ];

        var mg_king_table = [
            -65,  23,  16, -15, -56, -34,   2,  13,
            29,  -1, -20,  -7,  -8,  -4, -38, -29,
            -9,  24,   2, -16, -20,   6,  22, -22,
            -17, -20, -12, -27, -30, -25, -14, -36,
            -49,  -1, -27, -39, -46, -44, -33, -51,
            -14, -14, -22, -46, -44, -30, -15, -27,
            1,   7,  -8, -64, -43, -16,   9,   8,
            -15,  36,  12, -54,   8, -28,  24,  14,
        ];

        var eg_king_table = [
            -74, -35, -18, -18, -11,  15,   4, -17,
            -12,  17,  14,  17,  17,  38,  23,  11,
            10,  17,  23,  15,  20,  45,  44,  13,
            -8,  22,  24,  27,  26,  33,  26,   3,
            -18,  -4,  21,  24,  27,  23,   9, -11,
            -19,  -3,  11,  21,  23,  16,   7,  -9,
            -27, -11,   4,  13,  14,   4,  -5, -17,
            -53, -34, -21, -11, -28, -14, -24, -43
        ];

        var mg_pesto_table = [
            mg_pawn_table,
            mg_knight_table,
            mg_bishop_table,
            mg_rook_table,
            mg_queen_table,
            mg_king_table
        ];

        var eg_pesto_table = [
            eg_pawn_table,
            eg_knight_table,
            eg_bishop_table,
            eg_rook_table,
            eg_queen_table,
            eg_king_table
        ];

        var gamephaseInc = [0,0,1,1,1,1,2,2,4,4,0,0];
        var mg_table = new Array(12).fill(new Array(64));
        var eg_table = new Array(12).fill(new Array(64));

        function init_tables(){
            var pc, p, sq;
            for (p = PAWN, pc = WHITE_PAWN; p <= KING; pc += 2, p++) {
                for (sq = 0; sq < 64; sq++) {
                    mg_table[pc][sq] = mg_value[p] + mg_pesto_table[p][sq];
                    eg_table[pc][sq] = eg_value[p] + eg_pesto_table[p][sq];
                    mg_table[pc+1][sq] = mg_value[p] + mg_pesto_table[p][FLIP(sq)];
                    eg_table[pc+1][sq] = eg_value[p] + eg_pesto_table[p][FLIP(sq)];
                }
            }
        }
        init_tables();

        function eval(){
            var mg = new Array(2);
            var eg = new Array(2);
            var gamePhase = 0;

            mg[WHITE] = 0;
            mg[BLACK] = 0;
            eg[WHITE] = 0;
            eg[BLACK] = 0;

            /* evaluate each piece */
            for (var sq = 0; sq < 64; ++sq) {
                var pc = chess.game.board[sq];
                if (pc != EMPTY) {
                    pc = numToEVAL[pc];
                    mg[PCOLOR(pc)] += mg_table[pc][sq];
                    eg[PCOLOR(pc)] += eg_table[pc][sq];
                    gamePhase += gamephaseInc[pc];
                }
            }
            var COLOR = chess.game.whiteTurn == 1 ? WHITE : BLACK;
            var mgScore = mg[COLOR] - mg[OTHER(COLOR)];
            var egScore = eg[COLOR] - eg[OTHER(COLOR)];
            var mgPhase = gamePhase;
            if (mgPhase > 24) mgPhase = 24;
            var egPhase = 24 - mgPhase;
            return (mgScore * mgPhase + egScore * egPhase) / 24;
        }
        return eval;
    };
    chess.engine.Eval = chess.engine.EvalPosition();
    function Evaluate(){
        var evalVal = chess.engine.Eval();
        return evalVal;
    }
    function Quiesce(alpha = -9999, beta = 9999, depth = 3) {
        var stand_pat = Evaluate();
        if(stand_pat >= beta)
            return beta;
        if(alpha < stand_pat)
            alpha = stand_pat;

        GenerateAllMoves(false).forEach(element => {
            if(depth == 0) return beta;
            MakeMove(element);
            score = -Quiesce(-beta, -alpha, depth-1);
            UndoMove(element);

            if(score >= beta)
                return beta;
            if(score > alpha)
                alpha = score;
        });
        return alpha;
    }
    function EvalAlphaBeta(alpha, beta, depth){
        if(depth == 0) return Quiesce(alpha, beta, 1);
        GenerateAllMoves(false).forEach(element => {
            MakeMove(element);
            score = -EvalAlphaBeta(-beta, -alpha, depth-1);
            UndoMove(element);
            if(score >= beta)
                return beta;   //  fail hard beta-cutoff
            if(score > alpha)
                alpha = score; // alpha acts like max in MiniMax
        });
        return alpha;
    }

    function minimax(depth, alpha, beta, isMaximisingPlayer) {
        var ab = EvalAlphaBeta(alpha, beta, depth);
        return isMaximisingPlayer ? ab : ab;
    }

    function minimaxCote(depth, isMaximisingPlayer) {
        var newGameMoves = GenerateAllMoves(false);
        var bestMove = -9999;
        var bestMoveValue = 0;
        var bestMoveFound;
        for(var i = 0; i < newGameMoves.length; i++) {
            var newGameMove = newGameMoves[i];
            MakeMove(newGameMove);
            var value = minimax(depth - 1, -10000, 10000, !isMaximisingPlayer);
            UndoMove(newGameMove);
            if(value >= bestMove) {
                bestMove = value;
                bestMoveFound = newGameMove;
                bestMoveValue = i;
            }
        }
        return bestMoveFound;
    }
    chess.engine.move = 0;
    function AiMove(depth = 4){
        chess.engine.move = minimaxCote(depth, chess.game.whiteTurn == 1 ? true : false);
        return FormatMoveArr(chess.engine.move);
    }

    var functions = {
        AiMove, load: (fen) => {
            Initialize();
            InitializeFromFen(fen);
        }, AIMoveString: () => {
            return FormatMove(chess.engine.move);
        }, move: (move) => {
            MakeMove(GetMoveFromString(move));
        }, undo: (move) => {
            UndoMove(GetMoveFromString(move));
        }
    };
    functions.chess = chess;
    return functions;
}
