# Programming cooking simulator

This game is basically a programming version of PlateUp. You have to write little agents for each chef, telling them what to do and how to prioritize things.

We'll start with a simple slice of PlateUp: you have two dishes that customers want, maybe pizza with two different toppings. Some of the prep is shared, other parts have to be customized. Let's keep the limited counter space, slicing ingredients/preparing dough, combining ingredients, cooking, and serving from PlateUp, but have dishes come back automatically clean. Let's also have customers come in and immediately sit down and order.

We won't have any of the placement or roguelike parts of PlateUp: there's be a fixed layout which is a reasonable but not perfect kitchen. We'll support two chefs, and let's bias things so that one is front of house (serving, clearing dishes) and the other is doing prep.

I want a simple and clean visual style similar to PlateUp; give me four options to choose from.

The programming is the trickiest part. Let's create three variants: simple settings tuning some algorithm, simple code using a powerful API, to a full language. Also include a version that is just a simulation powered by the underlying javascript API. I don't think I want something very powerful for the player, but it is needed to implement the simpler variants; in the end I think the player should be making prioritization decisions and coordinating between the agents.

Do some thorough testing, including sub-optimal strategies, and tweak the game to make it challenging but not too challenging.
