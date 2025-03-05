import { PrismaClient } from "@prisma/client";
import parseDateString from "../utils/parseDateString";

const prisma = new PrismaClient();

export interface JobInput {
  title: string;
  company: string;
  location: string;
  description: string;
  postedDate: string | Date;
  jobUrl: string;
}

export class JobService {
  async createJob(jobData: JobInput) {
    const postedDate = typeof jobData.postedDate === 'string' 
      ? parseDateString(jobData.postedDate) || new Date()
      : jobData.postedDate;

    const uniqueIdentifier =
      `${jobData.title}-${jobData.company}-${jobData.location}`.toLowerCase();

    const existingJob = await prisma.jobs.findFirst({
      where: {
        job: jobData.title,
        company: jobData.company,
        location: jobData.location,
      },
    });

    if (existingJob) {
      return await prisma.jobs.update({
        where: { id: existingJob.id },
        data: {
          description: jobData.description,
          postedDate,
          updatedAt: new Date(),
        },
      });
    }

    return await prisma.jobs.create({
      data: {
        job: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description,
        postedDate,
        jobUrl: jobData.jobUrl,
      },
    });
  }

  async getAllJobs(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        skip,
        take: limit,
        orderBy: { postedDate: "desc" },
      }),
      prisma.jobs.count()
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getJobsByFilter(filters: {
    company?: string;
    location?: string;
    fromDate?: Date;
  }, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const whereClause = {
      ...(filters.company && { company: filters.company }),
      ...(filters.location && { location: filters.location }),
      ...(filters.fromDate && { postedDate: { gte: filters.fromDate } }),
    };

    const [jobs, total] = await Promise.all([
      prisma.jobs.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { postedDate: "desc" },
      }),
      prisma.jobs.count({ where: whereClause })
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
