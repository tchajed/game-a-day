# Mystery chat

I want to create a game with the following gameplay: you're given some brief backstory, then you copy a prompt into a chatbot (like Claude or ChatGPT) without reading it. This prompt sets up a conversation where the other side (the AI) has hidden information that you're trying to get at. The catch is that it's been instructed to talk in a certain way and not reveal information until you say the right things.

The hidden prompts should have all the story details ready for the AI to reveal as needed.

There are three potential settings I want to try this out in.

## Idea 1: job applicant that turns out to be powerful

This starts out as what seems like the player conducting a normal job interview, trying to assess a candidate. Before they start, they should have a basic resume. However, it turns out that the candidate is actually a powerful demon and will grant wishes if you make the right deal. The backstory does not indicate at all that something is supernatural.

## Idea 2: absentminded neighbor

In this one you're talking to your neighbor, who lives on the beach, about something innocuous, and it turns out they've seen a ghost ship with an undead crew sailing. The catch is that they're super absentminded and don't think much of it. Your goal is to get the full details and be able to see the ship yourself.

## Idea 3: cursed customer support

You're tech support, debugging a customer issue with their computer. However, it becomes increasingly clear as you pry that something is very wrong, and the owner of the laptop is a mage and their laptop is quite cursed. Again, like the other stories, nothing supernatural is indicated until the player asks the right questions.

## Testing

You should test this by doing runs of the game. I will want to review these run transcripts as well as the hidden prompts.

The player will get (a) a backstory on the website, and (b) a hidden prompt they start a chat conversation with. Testing should mimic this real setup, with maybe one additional prompt to guide the testing (such as to ask pointed questions or to just be naive). However, it's very important that the context engineering is correct on this: the game itself is also run by an LLM, and the fact that a test is being conducted should not leak into that chat. Use python around pi to orchestrate this.

The testing should use GPT 5.6 Sol with medium thinking.
