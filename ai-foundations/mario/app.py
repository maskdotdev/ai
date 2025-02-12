import pygame

# Initialize Pygame
pygame.init()

# --- Game Constants ---
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
SCREEN_TITLE = "Mario Bros Level 1 (Simplified)"
FPS = 60

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
BROWN = (139, 69, 19)
YELLOW = (255, 255, 0)
BLUE = (0, 0, 255)
GREEN = (0, 128, 0)
RED = (255, 0, 0)  # Red for Mario

# Player Constants
PLAYER_WIDTH = 30
PLAYER_HEIGHT = 50
PLAYER_SPEED = 5
GRAVITY = 1
JUMP_STRENGTH = -15  # Negative value for upward jump

# Block Constants
BLOCK_SIZE = 40

# --- Set up the display ---
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption(SCREEN_TITLE)
clock = pygame.time.Clock()

# --- Game Objects ---


class Player(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface([PLAYER_WIDTH, PLAYER_HEIGHT])
        self.image.fill(RED)  # Mario is red
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.velocity_y = 0
        self.is_jumping = False
        self.dx = 0  # Horizontal movement delta

    def update(self, blocks):
        # --- Horizontal Movement ---
        self.rect.x += self.dx
        # Check for horizontal collisions
        block_collision_list = pygame.sprite.spritecollide(self, blocks, False)
        for block in block_collision_list:
            if self.dx > 0:  # Moving right; hit left side of block
                self.rect.right = block.rect.left
            elif self.dx < 0:  # Moving left; hit right side of block
                self.rect.left = block.rect.right

        # --- Vertical Movement ---
        self.velocity_y += GRAVITY
        if self.velocity_y > 10:
            self.velocity_y = 10  # Limit falling speed
        self.rect.y += self.velocity_y

        # Check for vertical collisions
        block_collision_list = pygame.sprite.spritecollide(self, blocks, False)
        for block in block_collision_list:
            if self.velocity_y > 0:  # Falling; hit top of a block
                self.rect.bottom = block.rect.top
                self.velocity_y = 0
                self.is_jumping = False
            elif self.velocity_y < 0:  # Jumping; hit bottom of a block
                self.rect.top = block.rect.bottom
                self.velocity_y = 0

        # Reset horizontal movement after applying it
        self.dx = 0

    def jump(self):
        if not self.is_jumping:
            self.velocity_y = JUMP_STRENGTH
            self.is_jumping = True

    def draw(self, screen):
        screen.blit(self.image, self.rect)


class Block(pygame.sprite.Sprite):
    def __init__(self, x, y, color=BROWN):
        super().__init__()
        self.image = pygame.Surface([BLOCK_SIZE, BLOCK_SIZE])
        self.image.fill(color)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

    def draw(self, screen):
        screen.blit(self.image, self.rect)


class Pipe(pygame.sprite.Sprite):
    def __init__(self, x, y, width=BLOCK_SIZE, height=BLOCK_SIZE * 2):
        super().__init__()
        self.image = pygame.Surface([width, height])
        self.image.fill(GREEN)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

    def draw(self, screen):
        screen.blit(self.image, self.rect)


# --- Level Creation ---
all_sprites = pygame.sprite.Group()
block_list = pygame.sprite.Group()

# Create the player
player = Player(
    50, SCREEN_HEIGHT - PLAYER_HEIGHT - BLOCK_SIZE
)  # Start near bottom left
all_sprites.add(player)

# Ground blocks (the floor)
for i in range(0, SCREEN_WIDTH, BLOCK_SIZE):
    ground_block = Block(
        i, SCREEN_HEIGHT - BLOCK_SIZE, GREEN
    )  # Using GREEN for the ground
    block_list.add(ground_block)
    all_sprites.add(ground_block)

# Brick and question mark blocks (simplified layout)
block_positions = [
    (200, SCREEN_HEIGHT - BLOCK_SIZE * 3, YELLOW),  # Question mark block
    (240, SCREEN_HEIGHT - BLOCK_SIZE * 3, BROWN),  # Brick block
    (280, SCREEN_HEIGHT - BLOCK_SIZE * 3, BROWN),
    (320, SCREEN_HEIGHT - BLOCK_SIZE * 3, BROWN),
    (400, SCREEN_HEIGHT - BLOCK_SIZE * 5, YELLOW),  # Another question mark block
    (500, SCREEN_HEIGHT - BLOCK_SIZE * 3, BROWN),
    (540, SCREEN_HEIGHT - BLOCK_SIZE * 3, BROWN),
]

for x, y, color in block_positions:
    block = Block(x, y, color)
    block_list.add(block)
    all_sprites.add(block)

# Add a simple pipe (as seen in Mario Bros Level 1)
pipe_x = 600
# The pipe is 2 blocks tall; its top should be placed so its bottom aligns with the ground.
pipe_y = SCREEN_HEIGHT - BLOCK_SIZE - (BLOCK_SIZE * 2)
pipe = Pipe(pipe_x, pipe_y)
block_list.add(pipe)
all_sprites.add(pipe)

# --- Game Loop ---
running = True
while running:
    # --- Event Handling ---
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:  # Spacebar for jump
                player.jump()

    # --- Continuous Key Presses for Horizontal Movement ---
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        player.dx = -PLAYER_SPEED
    if keys[pygame.K_RIGHT]:
        player.dx = PLAYER_SPEED

    # --- Game Logic ---
    player.update(block_list)

    # --- Update Camera Offset ---
    # Calculate the horizontal offset so the player is centered.
    # You may want to add clamping so the camera doesn't show areas outside the level.
    camera_offset_x = player.rect.centerx - SCREEN_WIDTH // 2

    # --- Drawing ---
    screen.fill(BLUE)  # Sky blue background
    for entity in all_sprites:
        # Draw each sprite adjusted by the camera offset
        screen.blit(entity.image, (entity.rect.x - camera_offset_x, entity.rect.y))

    # --- Update the display ---
    pygame.display.flip()

    # --- Limit frame rate ---
    clock.tick(FPS)

# Quit Pygame
pygame.quit()
