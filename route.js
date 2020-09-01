'use strict';

const express = require("express");
const {firstLetterInUpperCase} = require('../util/util');
const models = require("../models");
const router = express.Router();

// Comment CRUD

router.get(
  "/get-comments/:modelId/:objectName",
  models.User.onlyForAuthorized.bind(models.User),
  async (req, res, next) => {
    try {
      const comments = await models.Comment.findAll({
        where: {
          modelId: req.params.modelId,
          objectId: req.params.objectName,
          status: 'APPROVE',
          parentId: null
        },
        include: [{
          model: models.User,
          attributes: ['firstName', 'lastName', 'middleName', 'photo']
        }]
      });

      for (const comment of comments) {
        comment.dataValues.isBookmark = await models.Comment.setBookmarkFlag(req.user ? req.user.id : null, comment.id);
        comment.dataValues.answers = await models.Comment.getCommentByParentId(comment.id, req.user.id, req.params.objectName, req.params.modelId);
      }

      res.status(200).json({
        status: "SUCCESS",
        items: firstLetterInUpperCase(comments),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/add-comment",
  models.User.onlyForAuthorized.bind(models.User),
  models.History.checkRequiredFields,
  async (req, res, next) => {
    try {
      ['objectName', 'modelId', 'text']
        .forEach(field => {
        if (!req.body[field]) {
          return res.status(400).json({
            code: `${field.toUpperCase()}_IS_REQUIRED`,
            message: `${field} is required`
          });
        }
      });

      let query = {
        userId: req.user.id,
        objectId: req.body.objectName,
        modelId: req.body.modelId,
        text: req.body.text,
        status: 'APPROVE'
      };

      if (req.body.parentId) {
        query.parentId = req.body.parentId;
      }

      const comment = await models.Comment.create(query);

      await models.History.writeHistory(
        req.user,
        req.body.ip,
        'create',
        'Comment',
        comment.id || null,
        comment.name || null
      );

      res.status(200).json({
        status: "SUCCESS",
        item: firstLetterInUpperCase(comment),
      });
    } catch (err) {
      next(err);
    }
  }
);
/**
 * Public routes end
 */

/**
 * Private routes start
 */

router.get(
  "/comments",
  models.User.onlyForAuthorized.bind(models.User),
  models.User.checkPermissions(['comment show']).bind(models.User),
  async (req, res, next) => {
    try {
      /**
       * status - NEW, APPROVE, BANNED
       */
      let query = {
        where: {},
        limit: req.query.limit || 12,
        offset: req.query.offset || 0
      };
      let queryTotal = {
        where: {},
      };

      if (req.query.status) {
        query.where.status = req.query.status;
        queryTotal.where.status = req.query.status;
      }

      const comments = await models.Comment.findAll(query);

      const total = await models.Comment.count(queryTotal);

      res.status(200).json({
        status: "SUCCESS",
        total: total,
        items: firstLetterInUpperCase(comments),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/comment/:id",
  models.User.onlyForAuthorized.bind(models.User),
  models.User.checkPermissions(['comment show']).bind(models.User),
  async (req, res, next) => {
    try {

      const comment = await models.Comment.findByPk(req.params.id);

      if (!comment) {
        return res.status(404).json({
          code: 'RESOURCES_NOT_FOUND',
          message: 'comment not found'
        });
      }
      res.status(200).json({
        status: "SUCCESS",
        item: firstLetterInUpperCase(comment),
      });
    } catch (err) {
      next(err);
    }
  }
);


router.post(
  "/comment/:id",
  models.User.onlyForAuthorized.bind(models.User),
  models.User.checkPermissions(['comment edit']).bind(models.User),
  models.History.checkRequiredFields,
  async (req, res, next) => {
    try {
      const fields = ['objectName', 'modelId', 'text', 'parentId', 'status'];
      const comment = await models.Comment.findByPk(req.params.id);

      if (!comment) {
        return res.status(404).json({
          code: 'RESOURCES_NOT_FOUND',
          message: 'comment not found'
        });
      }
      let query = {};

      fields.forEach(field => {
        if(req.body[field]) {
          query[field] = req.body[field];
        }
      });

      await comment.update(query);

      const saveComment = await models.Comment.findByPk(comment.id);

      await models.History.writeHistory(
        req.user,
        req.body.ip,
        'edit',
        'Comment',
        saveComment.id || null,
        saveComment.name || null
      );

      res.status(200).json({
        status: "SUCCESS",
        item: firstLetterInUpperCase(saveComment),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/comment",
  models.User.onlyForAuthorized.bind(models.User),
  models.User.checkPermissions(['comment create']).bind(models.User),
  models.History.checkRequiredFields,
  async (req, res, next) => {
    try {
      ['objectName', 'modelId', 'text', 'userId', 'status']
        .forEach(field => {
        if (!req.body[field]) {
          return res.status(400).json({
            code: `${field.toUpperCase()}_IS_REQUIRED`,
            message: `${field} is required`
          });
        }
      });

      const comment = await models.Comment.create({
        objectId: req.body.objectName,
        modelId: req.body.modelId,
        text: req.body.text,
        parentId: req.body.parentId,
        status: req.body.status,
        userId: req.body.userId,
      });

      await models.History.writeHistory(
        req.user,
        req.body.ip,
        'create',
        'Comment',
        comment.id || null,
        comment.name || null
      );

      res.status(200).json({
        status: "SUCCESS",
        item: firstLetterInUpperCase(comment),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/comment/:id",
  models.User.onlyForAuthorized.bind(models.User),
  models.User.checkPermissions(['comment delete']).bind(models.User),
  models.History.checkRequiredFields,
  async (req, res, next) => {
    try {
      const comment = await models.Comment.findByPk(req.params.id);

      if (!comment) {
        return res.status(404).json({
          code: 'RESOURCES_NOT_FOUND',
          message: 'comment not found'
        });
      }

      await comment.destroy();

      await models.History.writeHistory(
        req.user,
        req.body.ip,
        'delete',
        'Comment',
        comment.id || null,
        comment.name || null
      );

      res.status(200).json({
        status: "SUCCESS"
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
