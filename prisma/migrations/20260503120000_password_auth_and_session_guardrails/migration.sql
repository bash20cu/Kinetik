ALTER TABLE "users"
ADD COLUMN "password_hash" TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX "workout_sessions_user_id_day_id_session_date_key"
ON "workout_sessions"("user_id", "day_id", "session_date");
