import { Router } from "express";
import heathCheck from "../controllers/healthcheck.controller.js";


const router = Router();

router.route("/").get(heathCheck)

export default router