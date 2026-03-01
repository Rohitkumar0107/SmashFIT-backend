"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class TeamRepository {
    create(name, type, creatorId, avatarUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query('BEGIN');
                const team = (yield client.query(`
        INSERT INTO sm.teams (name, type, created_by, avatar_url)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [name, type, creatorId, avatarUrl])).rows[0];
                // Auto-add creator as OWNER (accepted)
                yield client.query(`
        INSERT INTO sm.team_members (team_id, user_id, role, status)
        VALUES ($1, $2, 'OWNER', 'ACCEPTED')
      `, [team.id, creatorId]);
                yield client.query('COMMIT');
                return team;
            }
            catch (err) {
                yield client.query('ROLLBACK');
                throw err;
            }
            finally {
                client.release();
            }
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT t.*,
        json_agg(json_build_object(
          'user_id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url,
          'role', tm.role, 'status', tm.status, 'joined_at', tm.joined_at
        )) AS members
      FROM sm.teams t
      LEFT JOIN sm.team_members tm ON tm.team_id = t.id
      LEFT JOIN sm.users u ON tm.user_id = u.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [id]);
            return rows[0] || null;
        });
    }
    addOrInviteMember(teamId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (teamId, userId, role = 'MEMBER') {
            const { rows } = yield db_1.default.query(`
      INSERT INTO sm.team_members (team_id, user_id, role, status)
      VALUES ($1, $2, $3, 'PENDING')
      ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role
      RETURNING *
    `, [teamId, userId, role]);
            return rows[0];
        });
    }
    isOwner(teamId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT 1 FROM sm.team_members
      WHERE team_id = $1 AND user_id = $2 AND role = 'OWNER' AND status = 'ACCEPTED'
    `, [teamId, userId]);
            return rows.length > 0;
        });
    }
}
exports.TeamRepository = TeamRepository;
