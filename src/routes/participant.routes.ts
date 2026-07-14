import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { addParticipant, getParticipants, removeParticipant } from "../controllers/participant.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/", addParticipant);
router.get("/", getParticipants);
router.delete("/:participantId", removeParticipant);

export default router;