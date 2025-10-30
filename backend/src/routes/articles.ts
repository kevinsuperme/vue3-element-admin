import { Router } from 'express';
import { ArticleController } from '../controllers/articleController';
import { auth } from '../middleware/auth';

const router = Router();

// 文章列表
router.get('/list', auth, ArticleController.getArticles);

// 文章详情
router.get('/detail', auth, ArticleController.getArticle);

// 创建文章
router.post('/create', auth, ArticleController.createArticle);

// 更新文章
router.post('/update', auth, ArticleController.updateArticle);

// 删除文章
router.delete('/delete/:id', auth, ArticleController.deleteArticle);

// 文章统计
router.get('/pv', auth, ArticleController.getArticleStats);

export { router as articleRoutes };
