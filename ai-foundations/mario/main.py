import pygame
import sys

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
TILE_SIZE = 40  # Size of each tile/block
PLAYER_WIDTH = 40
PLAYER_HEIGHT = 60
GRAVITY = 0.8
JUMP_SPEED = -15
MOVE_SPEED = 5

# Colors
SKY_BLUE = (107, 140, 255)
BROWN = (139, 69, 19)
RED = (255, 0, 0)

# Set up the display
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Super Mario (Simplified)")
clock = pygame.time.Clock()

# Level design - 1 represents blocks, 0 represents empty space
LEVEL = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

class Player:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT)
        self.vel_y = 0
        self.jumping = False
        self.on_ground = False

    def move(self, dx):
        self.rect.x += dx

    def apply_gravity(self):
        self.vel_y += GRAVITY
        self.rect.y += self.vel_y

    def jump(self):
        if self.on_ground:
            self.vel_y = JUMP_SPEED
            self.jumping = True
            self.on_ground = False

def get_blocks():
    """Convert the LEVEL array into a list of block rectangles"""
    blocks = []
    for row_index, row in enumerate(LEVEL):
        for col_index, cell in enumerate(row):
            if cell == 1:
                block_rect = pygame.Rect(
                    col_index * TILE_SIZE,
                    row_index * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                )
                blocks.append(block_rect)
    return blocks

def check_collision(player, blocks):
    """Handle collision detection between player and blocks"""
    player.on_ground = False
    
    for block in blocks:
        if player.rect.colliderect(block):
            # Bottom collision (landing)
            if player.vel_y > 0 and player.rect.bottom > block.top:
                player.rect.bottom = block.top
                player.vel_y = 0
                player.on_ground = True
                player.jumping = False
            # Top collision (hitting head)
            elif player.vel_y < 0 and player.rect.top < block.bottom:
                player.rect.top = block.bottom
                player.vel_y = 0
            # Side collisions
            if player.vel_y == 0:
                if player.rect.right > block.left and player.rect.left < block.left:
                    player.rect.right = block.left
                elif player.rect.left < block.right and player.rect.right > block.right:
                    player.rect.left = block.right

# Create player and get blocks
player = Player(100, SCREEN_HEIGHT - 200)
blocks = get_blocks()

# Game loop
running = True
while running:
    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                player.jump()

    # Handle player movement
    keys = pygame.key.get_pressed()
    if keys[pygame.K_a]:  # Move left
        player.move(-MOVE_SPEED)
    if keys[pygame.K_d]:  # Move right
        player.move(MOVE_SPEED)

    # Apply physics
    player.apply_gravity()
    check_collision(player, blocks)

    # Drawing
    screen.fill(SKY_BLUE)
    
    # Draw blocks
    for block in blocks:
        pygame.draw.rect(screen, BROWN, block)
    
    # Draw player
    pygame.draw.rect(screen, RED, player.rect)
    
    # Update display
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()
