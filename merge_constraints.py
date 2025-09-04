# 파일 이름: merge_constraints.py
import json
import argparse
from tqdm import tqdm

def main():
    parser = argparse.ArgumentParser(description="Merge constraint data (must_have, forbidden) into a main data file.")
    parser.add_argument("--data_file", required=True, help="병합의 기준이 될 원본 데이터 파일 (JSON)")
    parser.add_argument("--constraints_file", required=True, help="추가할 제약 조건 정보가 담긴 파일 (JSON/JSONL)")
    parser.add_argument("--output_file", required=True, help="병합된 결과가 저장될 출력 파일 (JSON)")
    args = parser.parse_args()

    # --- 파일 로드 ---
    print(f"Loading data from '{args.data_file}'...")
    with open(args.data_file, 'r', encoding='utf-8') as f:
        data_entries = json.load(f)

    print(f"Loading constraints from '{args.constraints_file}'...")
    # 제약 조건 파일이 JSONL일 수도 있으므로 한 줄씩 읽기
    constraint_entries = []
    with open(args.constraints_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                constraint_entries.append(json.loads(line))

    # --- 데이터 개수 확인 ---
    if len(data_entries) != len(constraint_entries):
        print("\n--- 경고 ---")
        print(f"두 파일의 항목 개수가 다릅니다! 데이터가 정확히 일치하지 않을 수 있습니다.")
        print(f"  '{args.data_file}'의 항목 수: {len(data_entries)}")
        print(f"  '{args.constraints_file}'의 항목 수: {len(constraint_entries)}")
        print("----------\n")

    # --- 데이터 병합 ---
    print("Merging constraints into data...")
    # 짧은 쪽 길이에 맞춰서 안전하게 zip
    num_to_merge = min(len(data_entries), len(constraint_entries))
    for i in tqdm(range(num_to_merge)):
        data_entries[i]['must_have'] = constraint_entries[i].get('must_have', [])
        data_entries[i]['sentiment'] = constraint_entries[i].get('sentiment', [])

    # --- 파일 저장 ---
    print(f"Saving merged file to '{args.output_file}'...")
    with open(args.output_file, 'w', encoding='utf-8') as f:
        json.dump(data_entries, f, indent=2, ensure_ascii=False)
    
    print("✅ Merging complete!")
    print(f"\n첫 번째 항목 확인:\n{json.dumps(data_entries[0], indent=2, ensure_ascii=False)}")


if __name__ == '__main__':
    main()