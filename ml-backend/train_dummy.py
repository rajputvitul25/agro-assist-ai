from model import PlantDiseaseDetector

if __name__ == '__main__':
    detector = PlantDiseaseDetector()
    # train on the small dummy dataset (will be extremely quick)
    detector.train('data/dummy', epochs=1, batch_size=2, learning_rate=1e-4, output_path='model.pth')
    print('Dummy training complete')
