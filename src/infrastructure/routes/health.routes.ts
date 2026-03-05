import express from 'express';
import { HealthController } from '../controller/HealthController';

const router = express.Router();

router.get('/', HealthController.health);

export default router;
