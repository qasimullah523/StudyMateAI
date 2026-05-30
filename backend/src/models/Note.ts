import { Schema, model, Types, type HydratedDocument } from "mongoose";

export interface Note {
  user: Types.ObjectId;
  fileName: string;
  uploadedAt?: Date;
  sourceText?: string;
  summary?: Record<string, unknown>;
  quiz?: Record<string, unknown>;
  flashcards?: Array<Record<string, unknown>>;
  planner?: Record<string, unknown>;
}

const NoteSchema = new Schema<Note>({
  user: { type: Schema.Types.ObjectId, ref: "User", index: true },
  fileName: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  sourceText: { type: String },
  summary: { type: Schema.Types.Mixed },
  quiz: { type: Schema.Types.Mixed },
  flashcards: { type: Array },
  planner: { type: Schema.Types.Mixed },
});

NoteSchema.index({ user: 1, uploadedAt: -1 });

export type NoteDocument = HydratedDocument<Note>;

const NoteModel = model<Note>("Note", NoteSchema);

export default NoteModel;
