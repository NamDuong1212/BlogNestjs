import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findOrCreateTags(tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const name of tagNames) {
      let tag = await this.tagRepository.findOne({ where: { name } });

      if (!tag) {
        tag = this.tagRepository.create({ name });
        await this.tagRepository.save(tag);
      }

      tags.push(tag);
    }

    return tags;
  }


  async deleteTagByName(name: string): Promise<void> {
    const tag = await this.tagRepository.findOne({ where: { name } });
    
    if (!tag) {
      throw new NotFoundException(`Tag with name "${name}" not found`);
    }

    await this.tagRepository.remove(tag);
  }

  async deleteManyTags(ids: number[]): Promise<void> {
    const tags = await this.tagRepository.findByIds(ids);
    
    if (tags.length !== ids.length) {
      const foundIds = tags.map(tag => tag.id);
      const missingIds = ids.filter(id => !foundIds.includes(id.toString()));
      throw new NotFoundException(`Tags with IDs ${missingIds.join(', ')} not found`);
    }

    await this.tagRepository.remove(tags);
  }

  async createTag(createTagDto: CreateTagDto): Promise<Tag> {
    const tag = this.tagRepository.create(createTagDto);
    await this.tagRepository.save(tag);
    return tag;
  }

  async getAllTags(): Promise<Tag[]> {
    return await this.tagRepository.find();
  }

  async getTagById(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const updatedTag = Object.assign(tag, updateTagDto);
    return this.tagRepository.save(updatedTag);
  }

  async deleteTag(id: string, isCreator: boolean): Promise<{ message: string }> {
    if (!isCreator) {
      throw new UnauthorizedException('Access denied. Creator only.');
    }

    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.tagRepository.remove(tag);

    return { message: 'Tag deleted successfully' };
  }
}