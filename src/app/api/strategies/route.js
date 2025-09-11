import { NextResponse } from 'next/server';
import prismaPromise from "@/lib/prisma";

// GET - Fetch all strategies
export async function GET(request) {
  const prisma = await prismaPromise;
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const isActive = searchParams.get('isActive');
    
    // Build where clause based on query parameters
    const where = {};
    if (mode) where.mode = mode;
    if (isActive !== null) where.isActive = isActive === 'true';
    
    const strategies = await prisma.strategy.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      strategies: strategies,
      count: strategies.length
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

// POST - Create new strategy
export async function POST(request) {
  const prisma = await prismaPromise;
  try {
    const body = await request.json();
    const { name, mode = 'MANUAL', isActive = false } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }
    
    // Validate enum values
    if (!['MANUAL', 'AUTO'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Must be MANUAL or AUTO' },
        { status: 400 }
      );
    }
    
    // Check if strategy with this name already exists
    const existingStrategy = await prisma.strategy.findUnique({
      where: { name }
    });
    
    if (existingStrategy) {
      return NextResponse.json(
        { success: false, error: 'Strategy with this name already exists' },
        { status: 409 }
      );
    }
    
    // Create new strategy
    const newStrategy = await prisma.strategy.create({
      data: {
        name,
        mode,
        isActive: Boolean(isActive)
      }
    });
    
    return NextResponse.json({
      success: true,
      strategy: newStrategy,
      message: 'Strategy created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}

// PATCH - Update strategy (activate/deactivate or other fields)
export async function PATCH(request) {
  const prisma = await prismaPromise;
  try {
    const body = await request.json();
    const { id, name, mode, isActive } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }
    
    // Check if strategy exists
    const existingStrategy = await prisma.strategy.findUnique({
      where: { id }
    });
    
    if (!existingStrategy) {
      return NextResponse.json(
        { success: false, error: 'Strategy not found' },
        { status: 404 }
      );
    }
    
    // Validate mode if provided
    if (mode && !['MANUAL', 'AUTO'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Must be MANUAL or AUTO' },
        { status: 400 }
      );
    }
    
    // Check if name is unique (if updating name)
    if (name && name !== existingStrategy.name) {
      const nameExists = await prisma.strategy.findUnique({
        where: { name }
      });
      
      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'Strategy with this name already exists' },
          { status: 409 }
        );
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (mode !== undefined) updateData.mode = mode;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    
    const updatedStrategy = await prisma.strategy.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      strategy: updatedStrategy,
      message: 'Strategy updated successfully'
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update strategy' },
      { status: 500 }
    );
  }
}
