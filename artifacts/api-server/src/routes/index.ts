import { Router, type IRouter } from "express";
import healthRouter from "./health";
import physicsRouter from "./physics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(physicsRouter);

export default router;
