from openai import OpenAI
import json

client = OpenAI(api_key="<INSERT_YOURS>")

def simulate_stock_price(example):
    str_example = json.dumps(example)
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "text": "Simulate stock market prices for a given asset. Consider the current stock price and a list of news articles, then determine the new price based on the expected impact of the news.\n\nUse provided inputs in JSON format and calculate a reasonable new stock price based on the nature of the given news. Each news item may have a positive, negative, or neutral effect on the stock.\n\n# Steps\n\n1. **Process Input**: Receive the input JSON containing the company's current stock price and a list of news items.\n2. **Analyze News Impact**: For each piece of news, determine if its tone is positive, negative, or neutral.\n   - Consider news sentiment, importance, and relevance.\n3. **Adjust Stock Price**: Depending on the combined influence of the news items:\n   - Positive news should boost the price.\n   - Negative news should decrease the price.\n   - Neutral/balanced news should not significantly affect the stock price.\n4. **Reason Calculation**: Provide a reasoning step determining how each news item influences the stock price.\n5. **Output Result**: Output the adjusted stock price as JSON, including a breakdown of how each news item affected the final value.\n\n# Output Format\n\nThe output should be in JSON format with the following structure:\n- `asset`: the name of the asset.\n- `current_price`: the original price provided.\n- `news_effect`: a list detailing each news item's effect.\n- `new_price`: the calculated new stock price.\n\nExample Output:\n```json\n{\n  \"asset\": \"[Company Name]\",\n  \"current_price\": [Current Price],\n  \"news_effect\": [\n    {\n      \"news\": \"[News headline or summary]\",\n      \"sentiment\": \"positive/negative/neutral\",\n      \"impact\": \"[Description of the impact on price]\"\n    },\n    ...\n  ],\n  \"new_price\": [Calculated New Price]\n}\n```\n\n# Example\n\n### Input:\n```json\n{\n  \"asset\": \"TechCo\",\n  \"current_price\": 150.00,\n  \"news\": [\n    \"TechCo reports 20% increase in quarterly revenue.\",\n    \"Lawsuit filed against TechCo over privacy concerns.\",\n    \"TechCo launches new smartphone model.\"\n  ]\n}\n```\n\n### Reasoning:\n- News headline 1: Positive news, will likely boost stock price due to strong earnings.\n- News headline 2: Negative news, expected to partially offset gains due to potential legal costs.\n- News headline 3: New product launch, likely positive, but depends on market response.\n\n### Output:\n```json\n{\n  \"asset\": \"TechCo\",\n  \"current_price\": 150.00,\n  \"news_effect\": [\n    {\n      \"news\": \"TechCo reports 20% increase in quarterly revenue.\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+5.00\"\n    },\n    {\n      \"news\": \"Lawsuit filed against TechCo over privacy concerns.\",\n      \"sentiment\": \"negative\",\n      \"impact\": \"-2.50\"\n    },\n    {\n      \"news\": \"TechCo launches new smartphone model.\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+3.00\"\n    }\n  ],\n  \"new_price\": 155.50\n}\n```\n\n# Notes\n\n- With conflicting news, the model should try to balance the impact proportionally.\n- Some news might not have significant impact. In such cases, the impact can be zero.\n- Consider edge cases like highly impactful news or unclear sentiment and provide a conservative change.\n",
                        "type": "text"
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "text": str_example,
                        "type": "text"
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=7665,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        response_format={
            "type": "json_object"
        }
    )
    return json.loads(response.choices[0].message.content)

def generate_news_headlines(next_company):
    response_two = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": "Generate positive and negative news headlines for a stock trading simulation game. You will receive the name of a company or its ticker symbol, and your task is to create a few relevant and imaginative news headlines that can be either positive or negative\n\n- The headlines can be humorous, surprising, or reflect something unexpected about the company.\n- Randomly decide if the news can be negative or upsetting themes. Feel free to be creative\n- Each headline should be succinct and convey its message clearly in an attention-grabbing way.\n\n# Steps\n\n1. Receive the company name or ticker.\n2. Create 1 to 3 distinct and engaging headlines that relate to the company.\n3. Ensure they vary in theme—mix reality-based humor, tragedies, failures, growth announcements, fictional innovations, partnership, rumors, gossip, etc.\n\n# Output Format\n\nReturn a JSON object structured as follows:\n- `headlines`: An array of strings, each representing a news headline.\n- There should be between 1 and 3 headlines in the array.\n\n```json\n{\n  \"headlines\": [\n    \"Headline 1\",\n    \"Headline 2\",\n    \"Headline 3\"\n  ]\n}\n```\n\n# Examples\n\n### Example 1 - Input:\nCompany: \"Tesla\"\n\n### Example 1 - Output:\n```json\n{\n  \"headlines\": [\n    \"Tesla Unveils Self-Driving Electric Helicopter. Elon Calls It 'Top Secret Fun Project'\",\n    \"Tesla Teams Up With SpaceX to Offer 'Martian-Ready' Cybertrucks for the Future Red Planet Colony\",\n    \"Industry experts dislike the new Cybertruck car. They say it looks like a dumpster\"\n  ]\n}\n```\n\n### Example 2 - Input:\nCompany: \"Apple\"\n\n### Example 2 - Output:\n```json\n{\n  \"headlines\": [\n    \"Apple Launches 'iPlant,' a Smart Home Device That Monitors Your Plants' Emotions\",\n    \"Apple and Disney sued by over privacy concerns.\",\n  ]\n}\n```\n\n# Notes\n\n- Headlines should be creative way, positive, and negative\n- Ensure headlines are suitable for a light-hearted stock simulation game but include some negative news\n- Keep each headline concise yet interesting, and vary their focus as much as possible."
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": next_company
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=6261,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        response_format={
            "type": "json_object"
        }
    )
    return json.loads(response_two.choices[0].message.content)

# Example usage
example = {
  "asset": "MSFT",
  "current_price": 495,
  "news": [
    "Microsoft Acquires Espresso Tech: Future Office Meetings to Be Powered by Coffee!",
    "New Windows Update Touted as 'Perfect' by Developers, But Users Find Bugs Quickly",
    "Microsoft's Cloud Gaming Expansion Faces Backlash from Traditional Gamers"
  ]
}

next_company = "Verizon"

stock_price_simulation = simulate_stock_price(example)
news_headlines = generate_news_headlines(next_company)

print(stock_price_simulation)
print(news_headlines)