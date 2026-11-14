import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.get('/themes', async (_req, res) => {
  try {
    const themes = await prisma.arenaTheme.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ themes });
  } catch (err) {
    console.error('Fetch themes error:', err);
    res.status(500).json({ error: 'Failed to load arena themes.' });
  }
});

router.get('/plugins', async (_req, res) => {
  try {
    const plugins = await prisma.plugin.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        version: true,
        enabled: true,
        configJson: true,
      },
    });
    res.json({ plugins });
  } catch (err) {
    console.error('Fetch plugins error:', err);
    res.status(500).json({ error: 'Failed to load enabled plugins.' });
  }
});

router.patch('/theme', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const themeSlug = String(req.body?.themeSlug ?? '').trim();
    if (!themeSlug) {
      res.status(400).json({ error: 'themeSlug is required.' });
      return;
    }

    const theme = await prisma.arenaTheme.findFirst({
      where: { slug: themeSlug, isActive: true },
    });
    if (!theme) {
      res.status(404).json({ error: 'Selected arena theme not found or inactive.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { preferredThemeSlug: theme.slug },
      select: { preferredThemeSlug: true },
    });

    res.json({ preferredThemeSlug: updated.preferredThemeSlug, theme });
  } catch (err) {
    console.error('Update user theme error:', err);
    res.status(500).json({ error: 'Failed to save arena theme preference.' });
  }
});

export default router;
