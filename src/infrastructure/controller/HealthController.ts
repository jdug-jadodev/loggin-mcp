import { Request, Response } from 'express';

export class HealthController {
  static health(req: Request, res: Response): void {
    const uptime = process.uptime();
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime * 100) / 100,
      version: '1.0.0',
      service: 'loggin-mcp',
    });
  }
}
