import { NextResponse } from 'next/server';

// In-memory storage for wishlist (in production, this would be in a database)
let wishlistStorage = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userWishlist = wishlistStorage.get(userId) || [];
    return NextResponse.json({ wishlist: userWishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, cryptoData, note } = body;

    if (!userId || !cryptoData) {
      return NextResponse.json({ error: 'User ID and crypto data are required' }, { status: 400 });
    }

    const userWishlist = wishlistStorage.get(userId) || [];
    
    // Check if crypto is already in wishlist
    const isAlreadyInWishlist = userWishlist.some(item => item.id === cryptoData.id);
    if (isAlreadyInWishlist) {
      return NextResponse.json({ error: 'Cryptocurrency already in wishlist' }, { status: 409 });
    }

    const wishlistItem = {
      ...cryptoData,
      addedAt: new Date().toISOString(),
      note: note || '',
      targetPrice: null
    };

    userWishlist.push(wishlistItem);
    wishlistStorage.set(userId, userWishlist);

    return NextResponse.json({ 
      message: 'Added to wishlist successfully',
      wishlist: userWishlist 
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userId, cryptoId } = body;

    if (!userId || !cryptoId) {
      return NextResponse.json({ error: 'User ID and crypto ID are required' }, { status: 400 });
    }

    const userWishlist = wishlistStorage.get(userId) || [];
    const updatedWishlist = userWishlist.filter(item => item.id !== cryptoId);
    
    wishlistStorage.set(userId, updatedWishlist);

    return NextResponse.json({ 
      message: 'Removed from wishlist successfully',
      wishlist: updatedWishlist 
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId, cryptoId, updates } = body;

    if (!userId || !cryptoId || !updates) {
      return NextResponse.json({ error: 'User ID, crypto ID, and updates are required' }, { status: 400 });
    }

    const userWishlist = wishlistStorage.get(userId) || [];
    const itemIndex = userWishlist.findIndex(item => item.id === cryptoId);
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found in wishlist' }, { status: 404 });
    }

    // Update the item
    userWishlist[itemIndex] = { ...userWishlist[itemIndex], ...updates };
    wishlistStorage.set(userId, userWishlist);

    return NextResponse.json({ 
      message: 'Wishlist updated successfully',
      wishlist: userWishlist 
    });
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
