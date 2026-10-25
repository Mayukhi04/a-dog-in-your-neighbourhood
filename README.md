# A Dog in your Neighbourhood!

### Inspiration
Our hackathon project was inspired by the classic snake game – while not developed in 2000, it was a staple on many Nokia phones and left a large cultural impact (as well as sitting on a large cardboard phone directly across from our team). We liked the replay-ability of its gameplay, and the way that simple collection and time pressure mechanics can make such an enjoyable experience.

As we continued to develop our game, we found ourselves looking to capture the joy of the Nintendo DS. A web browser game can’t ever capture the feel of holding it in your hands, but our decision to focus on including bright, pixelated graphics and an engaging soundscape come directly from our experiences with the handheld system.

This project is geared towards anyone who loves simple yet addictive gameplay and appreciates the charm and character of the Nintendo DS. We’re very proud of the creativity and depth we’ve managed to fit into this game, and we hope you enjoy exploring the neighbourhood!

### What it does
This web based game allows you to generate a postcode game map - either input a postcode you know, or randomly generate one! Once the game starts, you take on the role of a hungry dog looking for a meal in that location... with timer counting down in the corner, collecting a piece of meat adds to your score and gives you a little longer to keep on finding them. You can also collect bones to add a small bonus to your time, but this doesn't affect your score.

To make the game more challenging, we introduced several obstacles and enemies:

- **The Postman:** Travelling on his daily route, if you get in his path you will find your attention diverted... the player loses control of the dog for 3 seconds, as he can't help but give chase!

- **The Cat:** You're not the only one hungry out here, as the cat will be quick to steal any meat it can find and take it to safe place to eat. You can still collect these pieces, but you might find it involves more of a chase.

- **The Rotten Meat:** Streets aren't entirely suitable for food storage, so not all meat pieces are good to eat. Some will have subtle green colouring to show that it's rotting, and collecting these pieces will deduct time from your score.

- **The Hawk:** Always watching, the hawk is just waiting for the moment that your time hits zero. It will fly after you, but can be stopped if you manage to collect another piece of meat before it reaches you. Avoid being captured, as you are only a small dog, and birds can be mighty strong!

Additional controls include the ability to use arrows keys, WASD, or clicking directly on the Nintendo DS interface on screen. We also have buttons on the Nintendo DS controls that allow you to pause, mute, go back and also bark on command. This lets the player have the complete experience, no matter their playstyle! As this game has a lot of unique mechanics, we have also included an information button on the start page to ensure that the user isn't entering totally blind.

You can play this game on your laptop, or on your phone to better simulate the Nintendo DS interface!

### How we built it
The game map is based on real UK postcodes - we utilise the Open Roads Geopackage, which was available for free download and provides a high level overview of Britain's roads. Our code looks up the post code, finds the data belonging to it and then crops that to fit the screen space. For static hosting, we have have pre-generated maps based on key landmarks for 16 selectable cities.

The game itself is built using Phaser and JavaScript, as they provided the utility and adaptability we wanted when developing a web based game. Phaser specifically is a framework specifically designed for this kind of development, and it's functionality let us learn how to create core game play elements quickly.

### Challenges we ran into
Standardising the experience: We faced a lot of variability with the way in which the game map scaled in the Nintendo DS visual on different laptops. We were doing everything based off screen size, which was fine but caused issues with the way the DS lined up with the game screen. As a solution, we set the strict coordinates of edges of the screen, setting the dimensions before scaling to the screen itself. This made sure that not only were all team members seeing the same thing, so should any potential users! It even works on phones.

Edge cases for movement: The Postman, the Hawk, the Cat and the Dog all move independently of any kind of arrow keys at one point or another. We created roads that acted as the limit of where the Dog could move, but setting up rules for all these different kinds of movements was tricky. We ended up implementing a simplified form of pathfinding. For example, with the Postman, we search for a route across the map using the roads, and move him along it one road at a time. This ensures he always moves from left to right, in as close to a logical way as possible.

### Accomplishments that we're proud of
The post code aspect: The use of open source postcode data in this project added a new layer of complexity to the game. Each postcode is unique, and the connections between roads acts as its own difficulty rating system, affecting how easy it is to get to one side to the other. It's always fun to notice where a building you recognise should be as you rush away from the oncoming hawk!

Adding all our cool mechanics: We had a lot of fun thinking of ways to balance the difficulty of this game, as to begin with, collecting meat as a timer ran down was just too easy. Meat rotting, cats stealing food, the dog being unable to resist the postman and (of course) the hawk endgame were all incredibly interesting to explore and flesh out as concepts. We're very proud of this game!

### What we learned
How to grow an idea: We started out with a very simple concept, rooted in our deep love of the 2000's passion for the snake game, but we didn't want to reinvent the wheel. The best part of this hackathon was coming up with ideas of how we could add to our game, and how we might tackle problems; the game was too easy, we should add an enemy. The gameplay is too repetitive, we should introduce another mechanic. Exploring how to frame that in a dog eat dog world (or hawk fly dog world) let us be creative and push ourselves.

Identifying when problems are machine specific: With any web based development where you're all on the same branch most of the time, you get very good very quickly at learning how to solve problems specific to your machine, versus those that affect everyone!

### What's next for A Dog in Your Neighbourhood
We hope to explore more neighbourhoods with our dog concept, continuing to capture the charm of the Nintendo DS but increasing our postcode functionality and adding more fun and challenge to our core gameplay loop.

![puppy](assets/puppy.jpg)