import { Request, Response } from "express";
import * as manufacturerService from "../services/manufacturers/manufacturerService.js";
import {
  ManufacturerDtoType,
  CreateManufacturerDtoType,
  UpdateManufacturerDtoType,
  ManufacturerIdParamDtoType,
} from "../dtos/manufacturerDto.js";

async function getManufacturers(req: Request, res: Response) {
  const result = await manufacturerService.getManufacturers();
  res.json(result);
}

async function getManufacturerById(req: Request, res: Response) {
  const params = res.locals.params as ManufacturerIdParamDtoType;
  const result = await manufacturerService.getManufacturerById(params.id);
  res.json(result);
}

async function createManufacturer(req: Request, res: Response) {
  const body = res.locals.body as CreateManufacturerDtoType;
  const result = await manufacturerService.createManufacturer(body);
  res.status(201).json(result);
}

async function updateManufacturer(req: Request, res: Response) {
  const params = res.locals.params as ManufacturerIdParamDtoType;
  const body = res.locals.body as UpdateManufacturerDtoType;
  const result = await manufacturerService.updateManufacturer(params.id, body);
  res.json(result);
}

async function deleteManufacturer(req: Request, res: Response) {
  const params = res.locals.params as ManufacturerIdParamDtoType;
  await manufacturerService.deleteManufacturer(params.id);
  res.status(204).send();
}

export default {
  getManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
};

