# 파일 이름: transform_data.py
import json
import argparse
from tqdm import tqdm

def main():
    parser = argparse.ArgumentParser(description="Transform data format for human evaluation.")
    parser.add_argument("--input_file", required=True, help="변환할 원본 JSON 파일")
    parser.add_argument("--output_file", required=True, help="새로운 형식으로 저장할 JSON 파일")
    parser.add_argument("--model_a_name", type=str, default="Model-A", help="모델 A의 이름")
    parser.add_argument("--model_b_name", type=str, default="Model-B", help="모델 B의 이름")
    args = parser.parse_args()

    print(f"Loading original data from '{args.input_file}'...")
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            original_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error reading input file: {e}")
        return

    transformed_data = []
    print("Transforming data to the new format...")

    for item in tqdm(original_data, desc="Transforming"):
        new_item = {
            "id": item.get("id"),
            "prompt": item.get("prompt"),
            "must_have": item.get("must_have", []), # 제약조건 정보도 함께 전달
            "sentiment": item.get("sentiment", []),
            "model_A": {
                "name": args.model_a_name,
                "output": item.get("model_A_output", "")
            },
            "model_B": {
                "name": args.model_b_name,
                "output": item.get("model_B_output", "")
            }
        }
        transformed_data.append(new_item)

    print(f"Saving transformed data to '{args.output_file}'...")
    with open(args.output_file, 'w', encoding='utf-8') as f:
        json.dump(transformed_data, f, indent=2, ensure_ascii=False)
    
    print("✅ Transformation complete!")

if __name__ == '__main__':
    main()