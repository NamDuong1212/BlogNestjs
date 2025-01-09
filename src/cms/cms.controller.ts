import { Body, Controller, Post, UseGuards, Request, Patch, UnauthorizedException, Param } from '@nestjs/common';
import { CmsService } from './cms.service';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateCategoryDto } from 'src/category/dto/create-category.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateCategoryDto } from 'src/category/dto/update-category.dto';

@Controller('cms')
export class CmsController {
    constructor(
        private readonly cmsService: CmsService,
        private readonly jwtService: JwtService,
    ) {}

    @ApiTags('Cms')
    @ApiBearerAuth('admin')
    @ApiOperation({
        summary: 'Create admin account',
        description: 'Creates a new admin account.',
    })
    @ApiResponse({
        status: 201,
        description: 'Admin account created successfully.',
        type: SignupDto,
    })
    @Post('/signup')
    async signup(@Body() signupDto: SignupDto) {
        return this.cmsService.signup(signupDto);
    }

    @ApiTags('Cms')
    @ApiBearerAuth('admin')
    @ApiOperation({
        summary: 'Admin Login',
        description: 'Logs in an admin and returns admin information along with a JWT token.',
    })
    @ApiResponse({
        status: 200,
        description: 'Admin successfully logged in and token issued.',
        type: LoginDto,
    })
    @Post('/login')
    async login(@Body() loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.cmsService.login({ email, password });
        return user;
    }

    @ApiTags('Cms')
    @ApiBearerAuth('admin')
    @ApiOperation({
        summary: 'Create Category',
        description: 'Creates a new category.',
    })
    @ApiResponse({
        status: 201,
        description: 'Category created successfully.',
        type: CreateCategoryDto,
    })
    @Post('/category/create')
    @UseGuards(JwtAuthGuard, RoleGuard)
    async createCategory(
        @Request() req,
        @Body() createCategoryDto: CreateCategoryDto,
    ) {
        const category = await this.cmsService.createCategory(createCategoryDto);
        return { message: 'Category created successfully', data: category };
    }

    @ApiTags('Cms')
    @ApiBearerAuth('admin')
    @ApiOperation({
        summary: 'Update Category',
        description: 'Updates a category.',
    })
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully.',
        type: UpdateCategoryDto,
    })
    @Patch('/category/:id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    async updateCategory(
        @Request() req,
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        const user = req.user;
    
        if (!user || !user.isCreator) {
            throw new UnauthorizedException('Access denied. Creator only.');
        }
        const updateCategory = await this.cmsService.updateCategory(
            id,
            updateCategoryDto,
        );
        return { data: updateCategory };
    }
}
